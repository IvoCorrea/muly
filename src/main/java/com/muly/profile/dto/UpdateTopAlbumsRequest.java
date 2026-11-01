package com.muly.profile.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateTopAlbumsRequest(
        @NotNull(message = "Top albums list is required.")
        @Size(max = 4, message = "Top albums can have at most 4 items.")
        List<@Valid TopAlbumItemRequest> topAlbums
) {
}
