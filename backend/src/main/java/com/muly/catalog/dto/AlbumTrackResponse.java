package com.muly.catalog.dto;

public record AlbumTrackResponse(
        int trackNumber,
        String title,
        int durationMs
) {
}
