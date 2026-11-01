package com.muly.auth.service;

import com.muly.auth.dto.AuthResponse;
import com.muly.auth.dto.LoginRequest;
import com.muly.auth.dto.RegisterRequest;
import com.muly.auth.model.User;
import com.muly.auth.repository.UserRepository;
import com.muly.auth.security.JwtService;
import com.muly.common.exception.DuplicateResourceException;
import com.muly.common.exception.InvalidCredentialsException;
import com.muly.common.exception.ReservedUsernameException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Set;

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
}
