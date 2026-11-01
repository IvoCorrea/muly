package com.muly.catalog.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.muly.catalog.dto.AlbumDetailResponse;
import com.muly.catalog.dto.AlbumResponse;
import com.muly.catalog.dto.AlbumTrackResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

@Slf4j
@Service
public class SpotifyService {

    private final String clientId;
    private final String clientSecret;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    private String cachedToken;
    private Instant tokenExpiresAt = Instant.MIN;

    public SpotifyService(
            @Value("${spotify.client-id:}") String clientId,
            @Value("${spotify.client-secret:}") String clientSecret,
            ObjectMapper objectMapper
    ) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder().build();
    }

    public synchronized String getAccessToken() {
        if (cachedToken != null && Instant.now().isBefore(tokenExpiresAt.minusSeconds(60))) {
            return cachedToken;
        }

        if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()) {
            log.warn("Spotify Client ID or Client Secret is not configured. External search may be unavailable.");
            return null;
        }

        try {
            String credentials = Base64.getEncoder().encodeToString((clientId + ":" + clientSecret).getBytes(StandardCharsets.UTF_8));

            MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
            formData.add("grant_type", "client_credentials");

            String responseBody = restClient.post()
                    .uri("https://accounts.spotify.com/api/token")
                    .header(HttpHeaders.AUTHORIZATION, "Basic " + credentials)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(formData)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(responseBody);
            this.cachedToken = root.path("access_token").asText(null);
            int expiresIn = root.path("expires_in").asInt(3600);
            this.tokenExpiresAt = Instant.now().plusSeconds(expiresIn);
            return cachedToken;
        } catch (Exception e) {
            log.error("Failed to authenticate with Spotify API: {}", e.getMessage());
            return null;
        }
    }

    public List<AlbumResponse> searchAlbums(String query) {
        String token = getAccessToken();
        if (token == null || query == null || query.isBlank()) {
            return Collections.emptyList();
        }

        try {
            String responseBody = restClient.get()
                    .uri("https://api.spotify.com/v1/search?q={query}&type=album&limit=20", query)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode items = root.path("albums").path("items");
            if (!items.isArray()) {
                return Collections.emptyList();
            }

            List<AlbumResponse> result = new ArrayList<>();
            for (JsonNode item : items) {
                String externalId = item.path("id").asText();
                String title = item.path("name").asText();

                StringBuilder artistBuilder = new StringBuilder();
                JsonNode artists = item.path("artists");
                if (artists.isArray()) {
                    for (int i = 0; i < artists.size(); i++) {
                        if (i > 0) artistBuilder.append(", ");
                        artistBuilder.append(artists.get(i).path("name").asText());
                    }
                }
                String artist = artistBuilder.toString();

                Integer releaseYear = parseYear(item.path("release_date").asText(null));
                String coverUrl = extractCoverUrl(item.path("images"));

                result.add(new AlbumResponse(null, externalId, title, artist, releaseYear, coverUrl));
            }
            return result;
        } catch (Exception e) {
            log.error("Error searching albums on Spotify for query '{}': {}", query, e.getMessage());
            return Collections.emptyList();
        }
    }

    public AlbumDetailResponse getAlbumDetails(String spotifyId) {
        String token = getAccessToken();
        if (token == null || spotifyId == null || spotifyId.isBlank()) {
            return null;
        }

        try {
            String responseBody = restClient.get()
                    .uri("https://api.spotify.com/v1/albums/{id}", spotifyId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(responseBody);
            String externalId = root.path("id").asText();
            String title = root.path("name").asText();

            StringBuilder artistBuilder = new StringBuilder();
            JsonNode artists = root.path("artists");
            if (artists.isArray()) {
                for (int i = 0; i < artists.size(); i++) {
                    if (i > 0) artistBuilder.append(", ");
                    artistBuilder.append(artists.get(i).path("name").asText());
                }
            }
            String artist = artistBuilder.toString();

            Integer releaseYear = parseYear(root.path("release_date").asText(null));
            String coverUrl = extractCoverUrl(root.path("images"));

            List<AlbumTrackResponse> tracks = new ArrayList<>();
            JsonNode trackItems = root.path("tracks").path("items");
            if (trackItems.isArray()) {
                for (JsonNode trackNode : trackItems) {
                    int trackNumber = trackNode.path("track_number").asInt();
                    String trackTitle = trackNode.path("name").asText();
                    int durationMs = trackNode.path("duration_ms").asInt();
                    tracks.add(new AlbumTrackResponse(trackNumber, trackTitle, durationMs));
                }
            }

            return new AlbumDetailResponse(null, externalId, title, artist, releaseYear, coverUrl, tracks);
        } catch (Exception e) {
            log.error("Error fetching album details from Spotify for ID '{}': {}", spotifyId, e.getMessage());
            return null;
        }
    }

    private Integer parseYear(String releaseDate) {
        if (releaseDate != null && releaseDate.length() >= 4) {
            try {
                return Integer.parseInt(releaseDate.substring(0, 4));
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }

    private String extractCoverUrl(JsonNode images) {
        if (images != null && images.isArray() && !images.isEmpty()) {
            // First image is usually the largest (640x640), second is 300x300
            return images.get(0).path("url").asText(null);
        }
        return null;
    }
}
