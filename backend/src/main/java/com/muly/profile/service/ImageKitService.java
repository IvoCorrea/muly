package com.muly.profile.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Slf4j
@Service
public class ImageKitService {

    public record UploadResult(String url, String fileId) {}

    private final String privateKey;
    private final String publicKey;
    private final String urlEndpoint;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public ImageKitService(
            @Value("${imagekit.private-key:}") String privateKey,
            @Value("${imagekit.public-key:}") String publicKey,
            @Value("${imagekit.url-endpoint:}") String urlEndpoint
    ) {
        this.privateKey = privateKey;
        this.publicKey = publicKey;
        this.urlEndpoint = urlEndpoint;
        this.objectMapper = new ObjectMapper();
        this.restClient = RestClient.builder()
                .requestFactory(new SimpleClientHttpRequestFactory())
                .build();
    }

    public UploadResult uploadAvatar(String username, String base64Image) {
        if (privateKey == null || privateKey.isBlank()) {
            throw new IllegalStateException("ImageKit private key is not configured.");
        }
        if (base64Image == null || base64Image.isBlank()) {
            throw new IllegalArgumentException("Image data cannot be empty.");
        }

        // Approximate size validation (~4MB max base64 payload)
        if (base64Image.length() > 5_500_000) {
            throw new IllegalArgumentException("A imagem é muito grande. Escolha uma imagem menor que 4MB.");
        }

        String basicAuth = Base64.getEncoder()
                .encodeToString((privateKey.trim() + ":").getBytes(StandardCharsets.UTF_8));

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("file", base64Image.trim());
        formData.add("fileName", "avatar-" + username + ".jpg");
        formData.add("folder", "/muly/avatars");
        formData.add("useUniqueFileName", "true");

        try {
            String responseBody = restClient.post()
                    .uri("https://upload.imagekit.io/api/v1/files/upload")
                    .header(HttpHeaders.AUTHORIZATION, "Basic " + basicAuth)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(formData)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(responseBody);
            String rawUrl = root.path("url").asText(null);
            String fileId = root.path("fileId").asText(null);

            if (rawUrl == null || rawUrl.isBlank()) {
                throw new IllegalStateException("Failed to receive image URL from ImageKit.");
            }

            String optimizedUrl = rawUrl.contains("?")
                    ? rawUrl + "&tr=w-300,h-300,fo-auto,f-auto,q-85"
                    : rawUrl + "?tr=w-300,h-300,fo-auto,f-auto,q-85";

            return new UploadResult(optimizedUrl, fileId);
        } catch (Exception e) {
            log.error("Failed to upload avatar to ImageKit for user {}: {}", username, e.getMessage());
            throw new IllegalStateException("Falha ao enviar imagem para o ImageKit. Tente novamente.");
        }
    }

    public void deleteFileQuietly(String fileId) {
        if (fileId == null || fileId.isBlank() || privateKey == null || privateKey.isBlank()) {
            return;
        }
        try {
            String basicAuth = Base64.getEncoder()
                    .encodeToString((privateKey.trim() + ":").getBytes(StandardCharsets.UTF_8));

            restClient.delete()
                    .uri("https://api.imagekit.io/v1/files/{fileId}", fileId.trim())
                    .header(HttpHeaders.AUTHORIZATION, "Basic " + basicAuth)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.debug("Could not delete old ImageKit file {}: {}", fileId, e.getMessage());
        }
    }
}
