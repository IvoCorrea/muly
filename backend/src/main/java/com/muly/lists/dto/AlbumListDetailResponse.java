package com.muly.lists.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AlbumListDetailResponse(
        UUID id,
        String title,
        String description,
        String username,
        Instant createdAt,
        Instant updatedAt,
        long likesCount,
        boolean likedByMe,
        int reviewedPercentage,
        List<AlbumListItemResponse> items,
        List<AlbumListCommentResponse> comments
) {
}
