package com.muly.lists.dto;

import java.time.Instant;
import java.util.UUID;

public record AlbumListCommentResponse(
        UUID id,
        String username,
        String userDisplayName,
        String userAvatarUrl,
        String content,
        Instant createdAt
) {
}
