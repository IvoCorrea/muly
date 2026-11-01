package com.muly.profile.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record TopAlbumItemRequest(
        @NotNull(message = "Position is required.")
        @Min(value = 1, message = "Position must be between 1 and 4.")
        @Max(value = 4, message = "Position must be between 1 and 4.")
        Integer position,

        @NotBlank(message = "Spotify ID is required.")
        String spotifyId
) {
}
