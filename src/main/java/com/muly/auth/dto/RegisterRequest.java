package com.muly.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Username is required.")
        @Pattern(
                regexp = "^(?!\\.)(?!.*\\.$)(?!.*\\.\\.)[a-zA-Z0-9._]{1,30}$",
                message = "Username must be 1 to 30 characters and use only letters, numbers, '.' and '_' (no leading, trailing or consecutive periods)."
        )
        String username,

        @NotBlank(message = "Email is required.")
        @Email(message = "Please provide a valid email.")
        String email,

        @NotBlank(message = "Password is required.")
        @Size(min = 6, message = "Password must be at least 6 characters long.")
        @Size(max = 64, message = "Password should not pass 64 characters long.")
        String password
) {
}