package com.muly.lists.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AlbumListSummaryResponse(
        UUID id,
        String title,
        String description,
        String username,
        int albumCount,
        long likesCount,
        long commentsCount,
        List<String> previewCovers,
        Instant createdAt
) {
}
