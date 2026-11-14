package com.muly.catalog.dto;

import java.util.List;

public record ArtistDetailResponse(
        String artistName,
        int totalAlbums,
        long totalReviews,
        Double averageRating,
        List<RankedAlbumResponse> albums
) {
}
