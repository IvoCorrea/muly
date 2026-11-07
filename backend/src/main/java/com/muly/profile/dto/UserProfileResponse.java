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
        long totalReviews
) {
}
