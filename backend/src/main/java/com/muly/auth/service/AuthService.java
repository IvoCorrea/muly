package com.muly.auth.service;

import com.muly.auth.dto.AuthResponse;
import com.muly.auth.dto.ChangeUsernameRequest;
import com.muly.auth.dto.LoginRequest;
import com.muly.auth.dto.RegisterRequest;
import com.muly.auth.model.User;
import com.muly.auth.repository.UserRepository;
import com.muly.auth.security.JwtService;
import com.muly.common.exception.DuplicateResourceException;
import com.muly.common.exception.InvalidCredentialsException;
import com.muly.common.exception.ReservedUsernameException;
import com.muly.common.exception.ResourceNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class AuthService {

    private static final Set<String> RESERVED_USERNAMES = Set.of("me");
    private static final String INVALID_CREDENTIALS_MESSAGE = "Invalid username or password.";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String username = request.username().trim().toLowerCase(Locale.ROOT);
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        if (RESERVED_USERNAMES.contains(username)) {
            throw new ReservedUsernameException("Username '" + username + "' is reserved.");
        }

        if (userRepository.existsByUsername(username)) {
            throw new DuplicateResourceException("Username is already taken.");
        }

        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email is already registered.");
        }

        User user = User.builder()
                .username(username)
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .build();

        User savedUser = userRepository.save(user);
        String token = jwtService.generateToken(savedUser.getUsername());

        return new AuthResponse(token, savedUser.getUsername());
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String username = request.username().trim().toLowerCase(Locale.ROOT);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new InvalidCredentialsException(INVALID_CREDENTIALS_MESSAGE));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException(INVALID_CREDENTIALS_MESSAGE);
        }

        String token = jwtService.generateToken(user.getUsername());

        return new AuthResponse(token, user.getUsername());
    }

    @Transactional
    public AuthResponse loginOrRegisterOAuthUser(
            String email,
            String displayName,
            String avatarUrl,
            String preferredUsername
    ) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("OAuth2 provider did not return an email address.");
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        Optional<User> existingUser = userRepository.findByEmail(normalizedEmail);

        User user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
            boolean changed = false;
            if ((user.getDisplayName() == null || user.getDisplayName().isBlank())
                    && displayName != null && !displayName.isBlank()) {
                user.setDisplayName(truncate(displayName.trim(), 60));
                changed = true;
            }
            if ((user.getAvatarUrl() == null || user.getAvatarUrl().isBlank())
                    && isValidAvatarUrl(avatarUrl)) {
                user.setAvatarUrl(avatarUrl.trim());
                changed = true;
            }
            if (changed) {
                user = userRepository.save(user);
            }
        } else {
            String username = generateAvailableUsername(preferredUsername, normalizedEmail);
            String cleanDisplayName = (displayName != null && !displayName.isBlank())
                    ? truncate(displayName.trim(), 60)
                    : username;
            String cleanAvatarUrl = isValidAvatarUrl(avatarUrl) ? avatarUrl.trim() : null;

            User newUser = User.builder()
                    .username(username)
                    .email(normalizedEmail)
                    .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .displayName(cleanDisplayName)
                    .avatarUrl(cleanAvatarUrl)
                    .build();
            user = userRepository.save(newUser);
        }

        String token = jwtService.generateToken(user.getUsername());
        return new AuthResponse(token, user.getUsername());
    }

    @Transactional
    public AuthResponse changeUsername(String currentUsername, ChangeUsernameRequest request) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        String newUsername = request.username().trim().toLowerCase(Locale.ROOT);

        if (RESERVED_USERNAMES.contains(newUsername)) {
            throw new ReservedUsernameException("Username '" + newUsername + "' is reserved.");
        }

        if (newUsername.equals(user.getUsername())) {
            String token = jwtService.generateToken(user.getUsername());
            return new AuthResponse(token, user.getUsername());
        }

        if (userRepository.existsByUsername(newUsername)) {
            throw new DuplicateResourceException("Username is already taken.");
        }

        user.setUsername(newUsername);
        user = userRepository.save(user);

        String token = jwtService.generateToken(user.getUsername());
        return new AuthResponse(token, user.getUsername());
    }

    String generateAvailableUsername(String preferredUsername, String email) {
        String rawSeed = (preferredUsername != null && !preferredUsername.isBlank())
                ? preferredUsername
                : email.split("@", 2)[0];

        String normalized = Normalizer.normalize(rawSeed, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9._]+", "_")
                .replaceAll("\\.{2,}", ".");

        normalized = trimBoundaryPeriods(normalized);
        if (normalized.isEmpty()) {
            normalized = "user";
        }

        String base = truncate(normalized, 30);
        base = trimBoundaryPeriods(base);
        if (base.isEmpty()) {
            base = "user";
        }

        if (!RESERVED_USERNAMES.contains(base) && !userRepository.existsByUsername(base)) {
            return base;
        }

        for (int i = 1; i < 1000; i++) {
            String suffix = "_" + i;
            int maxBaseLen = Math.max(1, 30 - suffix.length());
            String slicedBase = trimBoundaryPeriods(truncate(base, maxBaseLen));
            if (slicedBase.isEmpty()) {
                slicedBase = "user";
            }
            String candidate = slicedBase + suffix;
            if (!RESERVED_USERNAMES.contains(candidate) && !userRepository.existsByUsername(candidate)) {
                return candidate;
            }
        }

        return "user_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }

    private static String trimBoundaryPeriods(String value) {
        String result = value;
        while (result.startsWith(".")) {
            result = result.substring(1);
        }
        while (result.endsWith(".")) {
            result = result.substring(0, result.length() - 1);
        }
        return result;
    }

    private static String truncate(String value, int maxLength) {
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    private static boolean isValidAvatarUrl(String avatarUrl) {
        return avatarUrl != null && !avatarUrl.isBlank() && avatarUrl.trim().length() <= 1024;
    }
}
