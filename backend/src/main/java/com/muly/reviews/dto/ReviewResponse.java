package com.muly.reviews.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ReviewResponse(
        UUID id,
        String username,
        String userDisplayName,
        String userAvatarUrl,
        String userBio,
        String userSpotifyUrl,
        String userLastfmUrl,
        String albumExternalId,
        String albumTitle,
        String albumArtist,
        String albumCoverUrl,
        Integer albumReleaseYear,
        Integer trackNumber,
        String trackTitle,
        Double rating,
        String reviewText,
        Instant createdAt,
        Instant updatedAt,
        long likesCount,
        boolean likedByMe,
        long commentsCount,
        List<ReviewCommentResponse> comments
) {
}
