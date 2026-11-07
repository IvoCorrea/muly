package com.muly.reviews.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateReviewCommentRequest(
        @NotBlank(message = "Comment content cannot be blank.")
        @Size(max = 1000, message = "Comment cannot exceed 1000 characters.")
        String content
) {
}
