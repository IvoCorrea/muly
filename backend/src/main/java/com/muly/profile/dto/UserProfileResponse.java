package com.muly.profile.dto;

import com.muly.catalog.dto.AlbumResponse;

import java.time.Instant;
import java.util.List;

public record UserProfileResponse(
        String username,
        Instant memberSince,
        AlbumResponse favoriteAlbum,
        CurrentTrackResponse currentTrack,
        List<TopAlbumItemResponse> topAlbums,
        long totalReviews
) {
}
