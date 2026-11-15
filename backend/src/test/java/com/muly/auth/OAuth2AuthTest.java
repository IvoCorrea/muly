package com.muly.auth;

import com.muly.auth.dto.AuthResponse;
import com.muly.auth.dto.OAuth2UrlResponse;
import com.muly.auth.model.User;
import com.muly.auth.repository.UserRepository;
import com.muly.auth.security.JwtService;
import com.muly.auth.service.AuthService;
import com.muly.auth.service.OAuth2Service;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class OAuth2AuthTest {

    private static final String TEST_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef";

    private List<User> userStore;
    private JwtService jwtService;
    private AuthService authService;
    private OAuth2Service oAuth2Service;

    @BeforeEach
    void setUp() {
        userStore = new ArrayList<>();
        UserRepository userRepository = (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findByEmail" -> {
                        String email = (String) args[0];
                        yield userStore.stream()
                                .filter(u -> u.getEmail().equalsIgnoreCase(email))
                                .findFirst();
                    }
                    case "findByUsername" -> {
                        String username = (String) args[0];
                        yield userStore.stream()
                                .filter(u -> u.getUsername().equalsIgnoreCase(username))
                                .findFirst();
                    }
                    case "existsByEmail" -> {
                        String email = (String) args[0];
                        yield userStore.stream().anyMatch(u -> u.getEmail().equalsIgnoreCase(email));
                    }
                    case "existsByUsername" -> {
                        String username = (String) args[0];
                        yield userStore.stream().anyMatch(u -> u.getUsername().equalsIgnoreCase(username));
                    }
                    case "save" -> {
                        User user = (User) args[0];
                        if (user.getId() == null) {
                            user.setId(UUID.randomUUID());
                        }
                        userStore.removeIf(u -> u.getId().equals(user.getId()));
                        userStore.add(user);
                        yield user;
                    }
                    default -> throw new UnsupportedOperationException("Unexpected call: " + method.getName());
                }
        );

        jwtService = new JwtService(TEST_SECRET, 3_600_000L);
        authService = new AuthService(userRepository, new BCryptPasswordEncoder(), jwtService);
        oAuth2Service = new OAuth2Service(
                authService,
                "google-client-id",
                "google-client-secret",
                "discord-client-id",
                "discord-client-secret"
        );
    }

    @Test
    void getAuthorizationUrlGeneratesGoogleUrl() {
        OAuth2UrlResponse response = oAuth2Service.getAuthorizationUrl(
                "google",
                "http://localhost:4200/oauth/callback",
                "state-123"
        );

        assertTrue(response.url().startsWith("https://accounts.google.com/o/oauth2/v2/auth?"));
        assertTrue(response.url().contains("client_id=google-client-id"));
        assertTrue(response.url().contains("redirect_uri=http%3A%2F%2Flocalhost%3A4200%2Foauth%2Fcallback"));
        assertTrue(response.url().contains("scope=openid%20email%20profile"));
        assertTrue(response.url().contains("state=state-123"));
    }

    @Test
    void getAuthorizationUrlGeneratesDiscordUrl() {
        OAuth2UrlResponse response = oAuth2Service.getAuthorizationUrl(
                "Discord",
                "http://localhost:4200/oauth/callback",
                "state-456"
        );

        assertTrue(response.url().startsWith("https://discord.com/oauth2/authorize?"));
        assertTrue(response.url().contains("client_id=discord-client-id"));
        assertTrue(response.url().contains("redirect_uri=http%3A%2F%2Flocalhost%3A4200%2Foauth%2Fcallback"));
        assertTrue(response.url().contains("scope=identify%20email"));
        assertTrue(response.url().contains("state=state-456"));
    }

    @Test
    void getAuthorizationUrlRejectsUnsupportedOrUnconfiguredProvider() {
        assertThrows(IllegalArgumentException.class, () ->
                oAuth2Service.getAuthorizationUrl("github", "http://localhost:4200/oauth/callback"));

        OAuth2Service unconfigured = new OAuth2Service(authService, "", "", "", "");
        assertThrows(IllegalArgumentException.class, () ->
                unconfigured.getAuthorizationUrl("google", "http://localhost:4200/oauth/callback"));
    }

    @Test
    void loginOrRegisterOAuthUserCreatesSanitizedUniqueUsername() {
        AuthResponse first = authService.loginOrRegisterOAuthUser(
                "Joao.Silva@Example.com",
                "João Silva",
                "https://cdn.example.com/avatar1.png",
                "João Silva."
        );

        assertEquals("joao_silva", first.username());
        assertEquals("joao_silva", jwtService.extractUsername(first.token()));
        assertEquals(1, userStore.size());
        assertEquals("joao.silva@example.com", userStore.get(0).getEmail());
        assertNotNull(userStore.get(0).getPasswordHash());

        AuthResponse second = authService.loginOrRegisterOAuthUser(
                "outro.joao@example.com",
                "João Outro",
                null,
                "João Silva"
        );
        assertEquals("joao_silva_1", second.username());

        AuthResponse reserved = authService.loginOrRegisterOAuthUser(
                "me@example.com",
                "Me",
                null,
                "me"
        );
        assertEquals("me_1", reserved.username());
    }

    @Test
    void loginOrRegisterOAuthUserLinksExistingEmailWithoutDuplicatingUser() {
        User existing = User.builder()
                .id(UUID.randomUUID())
                .username("ivo")
                .email("ivo@muly.com")
                .passwordHash("existing-hash")
                .displayName("Ivo Custom")
                .avatarUrl("https://existing-avatar.png")
                .build();
        userStore.add(existing);

        AuthResponse response = authService.loginOrRegisterOAuthUser(
                " IVO@muly.com ",
                "Novo Nome Google",
                "https://google-avatar.png",
                "ivo_google"
        );

        assertEquals(1, userStore.size());
        assertEquals("ivo", response.username());
        assertEquals("ivo", jwtService.extractUsername(response.token()));
        assertEquals("Ivo Custom", existing.getDisplayName());
        assertEquals("https://existing-avatar.png", existing.getAvatarUrl());
    }
}
