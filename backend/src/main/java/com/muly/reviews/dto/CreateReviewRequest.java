package com.muly.reviews.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateReviewRequest(
        @NotBlank(message = "Album Spotify ID is required.")
        String spotifyId,

        @NotNull(message = "Rating is required.")
        @DecimalMin(value = "0.5", message = "Rating must be at least 0.5.")
        @DecimalMax(value = "5.0", message = "Rating cannot exceed 5.0.")
        Double rating,

        @Size(max = 2000, message = "Review text cannot exceed 2000 characters.")
        String reviewText
) {
}
