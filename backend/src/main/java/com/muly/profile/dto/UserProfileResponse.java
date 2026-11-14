package com.muly.profile.dto;

import com.muly.catalog.dto.AlbumResponse;

import java.time.Instant;
import java.util.List;

public record UserProfileResponse(
        String username,
        String displayName,
        String bio,
        String avatarUrl,
        String spotifyProfileUrl,
        String lastfmProfileUrl,
        Instant memberSince,
        AlbumResponse favoriteAlbum,
        CurrentTrackResponse currentTrack,
        List<TopAlbumItemResponse> topAlbums,
        long totalReviews,
        long followersCount,
        long followingCount,
        boolean followedByMe,
        boolean followsMe,
        Integer tasteMatchPercentage,
        int commonItemsCount,
        List<ProfileBadgeResponse> badges
) {
    public UserProfileResponse(
            String username,
            String displayName,
            String bio,
            String avatarUrl,
            String spotifyProfileUrl,
            String lastfmProfileUrl,
            Instant memberSince,
            AlbumResponse favoriteAlbum,
            CurrentTrackResponse currentTrack,
            List<TopAlbumItemResponse> topAlbums,
            long totalReviews,
            long followersCount,
            long followingCount,
            boolean followedByMe,
            boolean followsMe,
            Integer tasteMatchPercentage,
            int commonItemsCount
    ) {
        this(
                username,
                displayName,
                bio,
                avatarUrl,
                spotifyProfileUrl,
                lastfmProfileUrl,
                memberSince,
                favoriteAlbum,
                currentTrack,
                topAlbums,
                totalReviews,
                followersCount,
                followingCount,
                followedByMe,
                followsMe,
                tasteMatchPercentage,
                commonItemsCount,
                List.of()
        );
    }
}
