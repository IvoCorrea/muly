package com.muly.profile.dto;

import com.muly.catalog.dto.AlbumResponse;

public record TopAlbumItemResponse(
        int position,
        AlbumResponse album
) {
}
