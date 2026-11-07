package com.muly.profile.dto;

public record FollowUserResponse(
        String username,
        String displayName,
        String avatarUrl,
        String bio,
        boolean followedByMe
) {
}
