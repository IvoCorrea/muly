package com.muly.profile.dto;

import jakarta.validation.constraints.Size;

public record SetCurrentTrackRequest(
        @Size(max = 255, message = "Track title cannot exceed 255 characters.")
        String title,

        @Size(max = 255, message = "Artist cannot exceed 255 characters.")
        String artist,

        @Size(max = 255, message = "Album title cannot exceed 255 characters.")
        String albumTitle,

        @Size(max = 1024, message = "Cover URL cannot exceed 1024 characters.")
        String coverUrl,

        @Size(max = 1024, message = "Preview URL cannot exceed 1024 characters.")
        String previewUrl
) {
}
