package com.muly.profile.controller;

import com.muly.profile.dto.SetFavoriteAlbumRequest;
import com.muly.profile.dto.UpdateTopAlbumsRequest;
import com.muly.profile.dto.UserProfileResponse;
import com.muly.profile.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMyProfile(Principal principal) {
        UserProfileResponse response = profileService.getProfile(principal.getName());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me/favorite-album")
    public ResponseEntity<UserProfileResponse> setFavoriteAlbum(
            @RequestBody SetFavoriteAlbumRequest request,
            Principal principal
    ) {
        UserProfileResponse response = profileService.setFavoriteAlbum(principal.getName(), request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me/top-albums")
    public ResponseEntity<UserProfileResponse> updateTopAlbums(
            @Valid @RequestBody UpdateTopAlbumsRequest request,
            Principal principal
    ) {
        UserProfileResponse response = profileService.updateTopAlbums(principal.getName(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{username}")
    public ResponseEntity<UserProfileResponse> getProfile(@PathVariable String username) {
        UserProfileResponse response = profileService.getProfile(username);
        return ResponseEntity.ok(response);
    }
}
