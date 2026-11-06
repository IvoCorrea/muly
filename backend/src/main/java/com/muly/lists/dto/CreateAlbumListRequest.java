package com.muly.lists.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateAlbumListRequest(
        @NotBlank(message = "List title is required.")
        @Size(max = 150, message = "Title cannot exceed 150 characters.")
        String title,

        @Size(max = 2000, message = "Description cannot exceed 2000 characters.")
        String description,

        List<String> spotifyIds
) {
}
