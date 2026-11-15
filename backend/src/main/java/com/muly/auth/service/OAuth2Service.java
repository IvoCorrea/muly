package com.muly.auth.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.muly.auth.dto.AuthResponse;
import com.muly.auth.dto.OAuth2CallbackRequest;
import com.muly.auth.dto.OAuth2UrlResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
public class OAuth2Service {

    private static final Logger log = LoggerFactory.getLogger(OAuth2Service.class);

    private static final String GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

    private static final String DISCORD_AUTH_URL = "https://discord.com/oauth2/authorize";
    private static final String DISCORD_TOKEN_URL = "https://discord.com/api/v10/oauth2/token";
    private static final String DISCORD_USERINFO_URL = "https://discord.com/api/v10/users/@me";
    private static final String DISCORD_USER_AGENT = "MulyApp/1.0";

    private final AuthService authService;
    private final String googleClientId;
    private final String googleClientSecret;
    private final String discordClientId;
    private final String discordClientSecret;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public OAuth2Service(
            AuthService authService,
            @Value("${oauth2.google.client-id:}") String googleClientId,
            @Value("${oauth2.google.client-secret:}") String googleClientSecret,
            @Value("${oauth2.discord.client-id:}") String discordClientId,
            @Value("${oauth2.discord.client-secret:}") String discordClientSecret
    ) {
        this.authService = authService;
        this.googleClientId = googleClientId != null ? googleClientId.trim() : "";
        this.googleClientSecret = googleClientSecret != null ? googleClientSecret.trim() : "";
        this.discordClientId = discordClientId != null ? discordClientId.trim() : "";
        this.discordClientSecret = discordClientSecret != null ? discordClientSecret.trim() : "";
        this.restClient = RestClient.builder()
                .requestFactory(new SimpleClientHttpRequestFactory())
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public OAuth2UrlResponse getAuthorizationUrl(String provider, String redirectUri) {
        return getAuthorizationUrl(provider, redirectUri, null);
    }

    public OAuth2UrlResponse getAuthorizationUrl(String provider, String redirectUri, String state) {
        String normalizedProvider = normalizeProvider(provider);
        String cleanRedirectUri = requireNonBlank(redirectUri, "Redirect URI is required.");

        StringBuilder url = new StringBuilder();
        switch (normalizedProvider) {
            case "google" -> {
                requireConfigured(googleClientId, "Google OAuth2 client ID is not configured.");
                url.append(GOOGLE_AUTH_URL)
                        .append("?client_id=").append(encodeParam(googleClientId))
                        .append("&redirect_uri=").append(encodeParam(cleanRedirectUri))
                        .append("&response_type=code")
                        .append("&scope=").append(encodeParam("openid email profile"))
                        .append("&prompt=select_account");
            }
            case "discord" -> {
                requireConfigured(discordClientId, "Discord OAuth2 client ID is not configured.");
                url.append(DISCORD_AUTH_URL)
                        .append("?client_id=").append(encodeParam(discordClientId))
                        .append("&redirect_uri=").append(encodeParam(cleanRedirectUri))
                        .append("&response_type=code")
                        .append("&scope=").append(encodeParam("identify email"));
            }
            default -> throw new IllegalArgumentException("Unsupported OAuth2 provider: " + provider);
        }

        if (state != null && !state.isBlank()) {
            url.append("&state=").append(encodeParam(state.trim()));
        }

        return new OAuth2UrlResponse(url.toString());
    }

    public AuthResponse authenticateWithCode(OAuth2CallbackRequest request) {
        String normalizedProvider = normalizeProvider(request.provider());
        String code = requireNonBlank(request.code(), "Authorization code is required.");
        String redirectUri = requireNonBlank(request.redirectUri(), "Redirect URI is required.");

        OAuthUserProfile profile = switch (normalizedProvider) {
            case "google" -> authenticateGoogle(code, redirectUri);
            case "discord" -> authenticateDiscord(code, redirectUri);
            default -> throw new IllegalArgumentException("Unsupported OAuth2 provider: " + request.provider());
        };

        return authService.loginOrRegisterOAuthUser(
                profile.email(),
                profile.displayName(),
                profile.avatarUrl(),
                profile.preferredUsername()
        );
    }

    private OAuthUserProfile authenticateGoogle(String code, String redirectUri) {
        requireConfigured(googleClientId, "Google OAuth2 client ID is not configured.");
        requireConfigured(googleClientSecret, "Google OAuth2 client secret is not configured.");

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("code", code);
        form.add("client_id", googleClientId);
        form.add("client_secret", googleClientSecret);
        form.add("redirect_uri", redirectUri);
        form.add("grant_type", "authorization_code");

        JsonNode tokenJson = postForm("Google", GOOGLE_TOKEN_URL, form, false);
        String accessToken = requireText(tokenJson, "access_token", "Failed to obtain access token from Google.");

        JsonNode userJson = getUserInfo("Google", GOOGLE_USERINFO_URL, accessToken, false);
        if (userJson.has("email_verified") && !userJson.get("email_verified").asBoolean()) {
            throw new IllegalArgumentException("Your Google account email must be verified to sign in.");
        }

        String email = requireText(userJson, "email", "Could not retrieve email address from Google.");
        String name = optionalText(userJson, "name");
        String picture = optionalText(userJson, "picture");
        String preferredUsername = optionalText(userJson, "given_name");
        if (preferredUsername == null) {
            preferredUsername = name;
        }

        return new OAuthUserProfile(email, name, picture, preferredUsername);
    }

    private OAuthUserProfile authenticateDiscord(String code, String redirectUri) {
        requireConfigured(discordClientId, "Discord OAuth2 client ID is not configured.");
        requireConfigured(discordClientSecret, "Discord OAuth2 client secret is not configured.");

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", discordClientId);
        form.add("client_secret", discordClientSecret);
        form.add("grant_type", "authorization_code");
        form.add("code", code);
        form.add("redirect_uri", redirectUri);

        JsonNode tokenJson = postForm("Discord", DISCORD_TOKEN_URL, form, true);
        String accessToken = requireText(tokenJson, "access_token", "Failed to obtain access token from Discord.");

        JsonNode userJson = getUserInfo("Discord", DISCORD_USERINFO_URL, accessToken, true);
        if (userJson.has("verified") && !userJson.get("verified").asBoolean()) {
            throw new IllegalArgumentException("Your Discord account email must be verified to sign in.");
        }

        String email = requireText(userJson, "email", "Could not retrieve email address from Discord.");
        String username = optionalText(userJson, "username");
        String globalName = optionalText(userJson, "global_name");
        String displayName = globalName != null ? globalName : username;

        String id = optionalText(userJson, "id");
        String avatarHash = optionalText(userJson, "avatar");
        String avatarUrl = null;
        if (id != null && avatarHash != null) {
            String ext = avatarHash.startsWith("a_") ? "gif" : "png";
            avatarUrl = "https://cdn.discordapp.com/avatars/" + id + "/" + avatarHash + "." + ext;
        }

        return new OAuthUserProfile(email, displayName, avatarUrl, username);
    }

    private JsonNode postForm(String providerLabel, String url, MultiValueMap<String, String> form, boolean sendDiscordUa) {
        try {
            RestClient.RequestBodySpec spec = restClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .accept(MediaType.APPLICATION_JSON);

            if (sendDiscordUa) {
                spec = spec.header(HttpHeaders.USER_AGENT, DISCORD_USER_AGENT);
            }

            String body = spec.body(form).retrieve().body(String.class);
            if (body == null || body.isBlank()) {
                throw new IllegalArgumentException("Empty token response from " + providerLabel + ".");
            }
            return objectMapper.readTree(body);
        } catch (RestClientResponseException ex) {
            log.warn("{} OAuth2 token exchange failed: status={} body={}", providerLabel, ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new IllegalArgumentException("Failed to exchange authorization code with " + providerLabel + ".");
        } catch (RestClientException ex) {
            log.warn("{} OAuth2 token exchange error: {}", providerLabel, ex.getMessage());
            throw new IllegalArgumentException("Could not reach " + providerLabel + " for authentication.");
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Failed to parse {} OAuth2 token response: {}", providerLabel, ex.getMessage());
            throw new IllegalArgumentException("Invalid response received from " + providerLabel + ".");
        }
    }

    private JsonNode getUserInfo(String providerLabel, String url, String accessToken, boolean sendDiscordUa) {
        try {
            RestClient.RequestHeadersSpec<?> spec = restClient.get()
                    .uri(url)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .accept(MediaType.APPLICATION_JSON);

            if (sendDiscordUa) {
                spec = spec.header(HttpHeaders.USER_AGENT, DISCORD_USER_AGENT);
            }

            String body = spec.retrieve().body(String.class);
            if (body == null || body.isBlank()) {
                throw new IllegalArgumentException("Empty profile response from " + providerLabel + ".");
            }
            return objectMapper.readTree(body);
        } catch (RestClientResponseException ex) {
            log.warn("{} OAuth2 userinfo failed: status={} body={}", providerLabel, ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new IllegalArgumentException("Failed to load user profile from " + providerLabel + ".");
        } catch (RestClientException ex) {
            log.warn("{} OAuth2 userinfo error: {}", providerLabel, ex.getMessage());
            throw new IllegalArgumentException("Could not reach " + providerLabel + " to load user profile.");
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Failed to parse {} OAuth2 userinfo response: {}", providerLabel, ex.getMessage());
            throw new IllegalArgumentException("Invalid user profile received from " + providerLabel + ".");
        }
    }

    private static String normalizeProvider(String provider) {
        if (provider == null || provider.isBlank()) {
            throw new IllegalArgumentException("OAuth2 provider is required.");
        }
        String normalized = provider.trim().toLowerCase(Locale.ROOT);
        if (!normalized.equals("google") && !normalized.equals("discord")) {
            throw new IllegalArgumentException("Unsupported OAuth2 provider: " + provider);
        }
        return normalized;
    }

    private static String requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private static void requireConfigured(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }

    private static String requireText(JsonNode node, String field, String errorMessage) {
        String value = optionalText(node, field);
        if (value == null) {
            throw new IllegalArgumentException(errorMessage);
        }
        return value;
    }

    private static String optionalText(JsonNode node, String field) {
        if (node == null || !node.hasNonNull(field)) {
            return null;
        }
        String text = node.get(field).asText("");
        return text.isBlank() ? null : text.trim();
    }

    private static String encodeParam(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private record OAuthUserProfile(
            String email,
            String displayName,
            String avatarUrl,
            String preferredUsername
    ) {
    }
}
