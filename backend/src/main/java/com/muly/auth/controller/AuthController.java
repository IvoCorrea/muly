package com.muly.auth.controller;

import com.muly.auth.dto.AuthResponse;
import com.muly.auth.dto.LoginRequest;
import com.muly.auth.dto.OAuth2CallbackRequest;
import com.muly.auth.dto.OAuth2UrlResponse;
import com.muly.auth.dto.RegisterRequest;
import com.muly.auth.service.AuthService;
import com.muly.auth.service.OAuth2Service;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final OAuth2Service oAuth2Service;

    public AuthController(AuthService authService, OAuth2Service oAuth2Service) {
        this.authService = authService;
        this.oAuth2Service = oAuth2Service;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/oauth2/url")
    public ResponseEntity<OAuth2UrlResponse> getOAuth2Url(
            @RequestParam String provider,
            @RequestParam String redirectUri,
            @RequestParam(required = false) String state
    ) {
        return ResponseEntity.ok(oAuth2Service.getAuthorizationUrl(provider, redirectUri, state));
    }

    @PostMapping("/oauth2/callback")
    public ResponseEntity<AuthResponse> oauth2Callback(@Valid @RequestBody OAuth2CallbackRequest request) {
        AuthResponse response = oAuth2Service.authenticateWithCode(request);
        return ResponseEntity.ok(response);
    }
}
