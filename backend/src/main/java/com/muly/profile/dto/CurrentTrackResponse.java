package com.muly.profile.dto;

public record CurrentTrackResponse(
        String title,
        String artist,
        String albumTitle,
        String coverUrl,
        String previewUrl
) {
}
