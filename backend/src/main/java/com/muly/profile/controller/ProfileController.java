package com.muly.profile.controller;

import com.muly.profile.dto.*;
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

    @PutMapping("/me/info")
    public ResponseEntity<UserProfileResponse> updateProfileInfo(
            @Valid @RequestBody UpdateProfileInfoRequest request,
            Principal principal
    ) {
        UserProfileResponse response = profileService.updateProfileInfo(principal.getName(), request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/me/avatar")
    public ResponseEntity<UserProfileResponse> uploadAvatar(
            @RequestBody UploadAvatarRequest request,
            Principal principal
    ) {
        UserProfileResponse response = profileService.uploadAvatar(principal.getName(), request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/me/avatar")
    public ResponseEntity<UserProfileResponse> deleteAvatar(Principal principal) {
        UserProfileResponse response = profileService.deleteAvatar(principal.getName());
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

    @PutMapping("/me/current-track")
    public ResponseEntity<UserProfileResponse> setCurrentTrack(
            @Valid @RequestBody SetCurrentTrackRequest request,
            Principal principal
    ) {
        UserProfileResponse response = profileService.setCurrentTrack(principal.getName(), request);
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
