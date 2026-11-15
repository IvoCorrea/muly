package com.muly.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record OAuth2CallbackRequest(
        @NotBlank(message = "Provider is required.")
        String provider,

        @NotBlank(message = "Authorization code is required.")
        String code,

        @NotBlank(message = "Redirect URI is required.")
        String redirectUri
) {
}
