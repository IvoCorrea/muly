package com.muly.catalog.dto;

public record TrackSearchResponse(
        String title,
        String artist,
        String albumTitle,
        String coverUrl,
        String previewUrl
) {
}
