package com.muly.reviews.dto;

import java.time.Instant;
import java.util.UUID;

public record ReviewCommentResponse(
        UUID id,
        UUID reviewId,
        String username,
        String userDisplayName,
        String userAvatarUrl,
        String content,
        Instant createdAt
) {
}
