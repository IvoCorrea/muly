package com.muly.auth.dto;

public record AuthResponse(
        String token,
        String username
) {
}
