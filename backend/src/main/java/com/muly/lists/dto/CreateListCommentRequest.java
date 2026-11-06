package com.muly.lists.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateListCommentRequest(
        @NotBlank(message = "Comment cannot be empty.")
        @Size(max = 1000, message = "Comment cannot exceed 1000 characters.")
        String content
) {
}
