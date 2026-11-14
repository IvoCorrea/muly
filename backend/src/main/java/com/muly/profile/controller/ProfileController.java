package com.muly.profile.controller;

import com.muly.catalog.dto.AlbumResponse;
import com.muly.profile.dto.*;
import com.muly.profile.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMyProfile(Principal principal) {
        UserProfileResponse response = profileService.getProfile(principal.getName(), principal.getName());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateFullProfile(
            @Valid @RequestBody UpdateFullProfileRequest request,
            Principal principal
    ) {
        UserProfileResponse response = profileService.updateFullProfile(principal.getName(), request);
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
    public ResponseEntity<UserProfileResponse> getProfile(
            @PathVariable String username,
            Principal principal
    ) {
        String viewer = principal != null ? principal.getName() : null;
        UserProfileResponse response = profileService.getProfile(username, viewer);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{username}/follow")
    public ResponseEntity<UserProfileResponse> toggleFollow(
            @PathVariable String username,
            Principal principal
    ) {
        UserProfileResponse response = profileService.toggleFollow(principal.getName(), username);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{username}/followers")
    public ResponseEntity<List<FollowUserResponse>> getFollowers(
            @PathVariable String username,
            Principal principal
    ) {
        String viewer = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(profileService.getFollowers(username, viewer));
    }

    @GetMapping("/{username}/following")
    public ResponseEntity<List<FollowUserResponse>> getFollowing(
            @PathVariable String username,
            Principal principal
    ) {
        String viewer = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(profileService.getFollowing(username, viewer));
    }

    @GetMapping("/{username}/listen-later")
    public ResponseEntity<List<AlbumResponse>> getListenLater(@PathVariable String username) {
        return ResponseEntity.ok(profileService.getListenLater(username));
    }

    @GetMapping("/me/listen-later/{spotifyId}")
    public ResponseEntity<Map<String, Boolean>> getListenLaterStatus(
            @PathVariable String spotifyId,
            Principal principal
    ) {
        boolean saved = profileService.isSavedInListenLater(principal.getName(), spotifyId);
        return ResponseEntity.ok(Map.of("saved", saved));
    }

    @PostMapping("/me/listen-later/{spotifyId}")
    public ResponseEntity<Map<String, Boolean>> toggleListenLater(
            @PathVariable String spotifyId,
            Principal principal
    ) {
        boolean saved = profileService.toggleListenLater(principal.getName(), spotifyId);
        return ResponseEntity.ok(Map.of("saved", saved));
    }

    @GetMapping("/me/lastfm/top-albums")
    public ResponseEntity<List<AlbumResponse>> importLastfmTopAlbums(
            @RequestParam("username") String username
    ) {
        return ResponseEntity.ok(profileService.importLastfmTopAlbums(username));
    }
}
