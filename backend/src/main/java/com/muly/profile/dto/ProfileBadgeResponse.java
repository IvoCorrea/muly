package com.muly.profile.dto;

public record ProfileBadgeResponse(
        String id,
        String icon,
        String label,
        String description
) {
}
