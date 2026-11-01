package com.muly.catalog.dto;

import java.util.List;
import java.util.UUID;

public record AlbumDetailResponse(
        UUID id,
        String externalId,
        String title,
        String artist,
        Integer releaseYear,
        String coverUrl,
        List<AlbumTrackResponse> tracks
) {
}
