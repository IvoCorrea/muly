package com.muly.profile.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileInfoRequest(
        @Size(max = 60, message = "Display name must be at most 60 characters.")
        String displayName,

        @Size(max = 240, message = "Bio must be at most 240 characters.")
        String bio,

        @Size(max = 512, message = "Spotify link must be at most 512 characters.")
        String spotifyProfileUrl,

        @Size(max = 512, message = "Last.fm link must be at most 512 characters.")
        String lastfmProfileUrl
) {
}
