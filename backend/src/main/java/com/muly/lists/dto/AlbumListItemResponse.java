package com.muly.lists.dto;

import com.muly.catalog.dto.AlbumResponse;

public record AlbumListItemResponse(
        int position,
        AlbumResponse album,
        boolean reviewedByMe
) {
}
