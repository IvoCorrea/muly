package com.muly.catalog.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.muly.catalog.dto.AlbumDetailResponse;
import com.muly.catalog.dto.AlbumResponse;
import com.muly.catalog.dto.AlbumTrackResponse;
import com.muly.catalog.dto.TrackSearchResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
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
            @Value("${spotify.client-secret:}") String clientSecret
    ) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.objectMapper = new ObjectMapper();
        this.restClient = RestClient.builder()
                .requestFactory(new SimpleClientHttpRequestFactory())
                .build();
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
                    .uri("https://api.spotify.com/v1/search?q={query}&type=album&limit=10", query)
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

    public List<TrackSearchResponse> searchTracksWithPreview(String query) {
        if (query == null || query.isBlank()) {
            return Collections.emptyList();
        }

        // 1. Try public iTunes Search API (no token required, permanent previewUrl)
        try {
            String responseBody = restClient.get()
                    .uri("https://itunes.apple.com/search?term={query}&media=music&entity=song&limit=8", query.trim())
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode results = root.path("results");
            if (results.isArray() && !results.isEmpty()) {
                List<TrackSearchResponse> tracks = new ArrayList<>();
                for (JsonNode item : results) {
                    String previewUrl = item.path("previewUrl").asText(null);
                    if (previewUrl == null || previewUrl.isBlank()) continue;

                    String title = item.path("trackName").asText("");
                    String artist = item.path("artistName").asText("");
                    String albumTitle = item.path("collectionName").asText("");
                    String coverUrl = item.path("artworkUrl100").asText(null);
                    if (coverUrl != null) {
                        coverUrl = coverUrl.replace("100x100bb", "300x300bb");
                    }

                    String spotifyUrl = buildSpotifyTrackSearchUrl(title, artist);
                    tracks.add(new TrackSearchResponse(title, artist, albumTitle, coverUrl, previewUrl, spotifyUrl));
                }
                if (!tracks.isEmpty()) {
                    return tracks;
                }
            }
        } catch (Exception e) {
            log.warn("iTunes public search fallback to Deezer for query '{}': {}", query, e.getMessage());
        }

        // 2. Fallback to public Deezer API (no token required)
        try {
            String responseBody = restClient.get()
                    .uri("https://api.deezer.com/search?q={query}&limit=8", query.trim())
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode data = root.path("data");
            if (data.isArray()) {
                List<TrackSearchResponse> tracks = new ArrayList<>();
                for (JsonNode item : data) {
                    String previewUrl = item.path("preview").asText(null);
                    if (previewUrl == null || previewUrl.isBlank()) continue;

                    String title = item.path("title").asText("");
                    String artist = item.path("artist").path("name").asText("");
                    String albumTitle = item.path("album").path("title").asText("");
                    String coverUrl = item.path("album").path("cover_medium").asText(null);
                    String spotifyUrl = buildSpotifyTrackSearchUrl(title, artist);

                    tracks.add(new TrackSearchResponse(title, artist, albumTitle, coverUrl, previewUrl, spotifyUrl));
                }
                return tracks;
            }
        } catch (Exception e) {
            log.error("Error searching tracks on public APIs for query '{}': {}", query, e.getMessage());
        }

        return Collections.emptyList();
    }

    public String buildSpotifyTrackSearchUrl(String title, String artist) {
        String searchTerm = ((title != null ? title : "") + " " + (artist != null ? artist : "")).trim();
        return "https://open.spotify.com/search/" + URLEncoder.encode(searchTerm, StandardCharsets.UTF_8).replace("+", "%20");
    }

    public String resolveSpotifyTrackUrl(String title, String artist) {
        String searchTerm = ((title != null ? title : "") + " " + (artist != null ? artist : "")).trim();
        String fallbackUrl = buildSpotifyTrackSearchUrl(title, artist);

        String token = getAccessToken();
        if (token == null || searchTerm.isBlank()) {
            return fallbackUrl;
        }

        try {
            String responseBody = restClient.get()
                    .uri("https://api.spotify.com/v1/search?q={query}&type=track&limit=1", searchTerm)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode items = root.path("tracks").path("items");
            if (items.isArray() && !items.isEmpty()) {
                String externalUrl = items.get(0).path("external_urls").path("spotify").asText(null);
                if (externalUrl != null && !externalUrl.isBlank()) {
                    return externalUrl;
                }
                String trackId = items.get(0).path("id").asText(null);
                if (trackId != null && !trackId.isBlank()) {
                    return "https://open.spotify.com/track/" + trackId;
                }
            }
        } catch (Exception ignored) {
        }

        return fallbackUrl;
    }
}
