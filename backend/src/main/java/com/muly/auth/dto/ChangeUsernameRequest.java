package com.muly.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ChangeUsernameRequest(
        @NotBlank(message = "Username is required.")
        @Pattern(
                regexp = "^(?!\\.)(?!.*\\.$)(?!.*\\.\\.)[a-zA-Z0-9._]{1,30}$",
                message = "Username must be 1 to 30 characters and use only letters, numbers, '.' and '_' (no leading, trailing or consecutive periods)."
        )
        String username
) {
}
