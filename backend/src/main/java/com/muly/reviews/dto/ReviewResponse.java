package com.muly.reviews.dto;

import java.time.Instant;
import java.util.UUID;

public record ReviewResponse(
        UUID id,
        String username,
        String albumExternalId,
        String albumTitle,
        String albumArtist,
        String albumCoverUrl,
        Integer albumReleaseYear,
        Double rating,
        String reviewText,
        Instant createdAt,
        Instant updatedAt
) {
}
