package com.muly.social.dto;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        String actorUsername,
        String actorDisplayName,
        String actorAvatarUrl,
        String type,
        String message,
        String targetUrl,
        boolean read,
        Instant createdAt
) {
}
