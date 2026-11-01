package com.muly.catalog.dto;

import java.util.UUID;

public record AlbumResponse(
        UUID id,
        String externalId,
        String title,
        String artist,
        Integer releaseYear,
        String coverUrl
) {
}
