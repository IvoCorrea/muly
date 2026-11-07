package com.muly.profile.service;

import com.muly.auth.model.User;
import com.muly.auth.service.UserService;
import com.muly.catalog.dto.AlbumResponse;
import com.muly.catalog.model.Album;
import com.muly.catalog.service.CatalogService;
import com.muly.catalog.service.SpotifyService;
import com.muly.common.exception.ResourceNotFoundException;
import com.muly.profile.dto.*;
import com.muly.profile.model.TopAlbum;
import com.muly.profile.repository.TopAlbumRepository;
import com.muly.reviews.service.ReviewService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class ProfileService {

    private final TopAlbumRepository topAlbumRepository;
    private final UserService userService;
    private final CatalogService catalogService;
    private final ReviewService reviewService;
    private final SpotifyService spotifyService;
    private final ImageKitService imageKitService;

    public ProfileService(
            TopAlbumRepository topAlbumRepository,
            UserService userService,
            CatalogService catalogService,
            ReviewService reviewService,
            SpotifyService spotifyService,
            ImageKitService imageKitService
    ) {
        this.topAlbumRepository = topAlbumRepository;
        this.userService = userService;
        this.catalogService = catalogService;
        this.reviewService = reviewService;
        this.spotifyService = spotifyService;
        this.imageKitService = imageKitService;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String username) {
        String normalizedUsername = username.trim().toLowerCase(Locale.ROOT);
        User user = userService.getByUsername(normalizedUsername);

        AlbumResponse favoriteAlbum = null;
        if (user.getFavoriteAlbumId() != null) {
            try {
                favoriteAlbum = catalogService.getAlbumById(user.getFavoriteAlbumId());
            } catch (ResourceNotFoundException ignored) {
            }
        }

        List<TopAlbum> topEntities = topAlbumRepository.findByUserUsernameOrderByPositionAsc(user.getUsername());
        List<TopAlbumItemResponse> topAlbums = topEntities.stream()
                .map(top -> new TopAlbumItemResponse(top.getPosition(), catalogService.toResponse(top.getAlbum())))
                .toList();

        long totalReviews = reviewService.countReviewsByUser(user.getUsername());

        CurrentTrackResponse currentTrack = null;
        if (user.getCurrentTrackTitle() != null && !user.getCurrentTrackTitle().isBlank()) {
            String spotifyUrl = user.getCurrentTrackSpotifyUrl();
            if (spotifyUrl == null || spotifyUrl.isBlank()) {
                spotifyUrl = spotifyService.buildSpotifyTrackSearchUrl(user.getCurrentTrackTitle(), user.getCurrentTrackArtist());
            }
            currentTrack = new CurrentTrackResponse(
                    user.getCurrentTrackTitle(),
                    user.getCurrentTrackArtist(),
                    user.getCurrentTrackAlbum(),
                    user.getCurrentTrackCoverUrl(),
                    user.getCurrentTrackPreviewUrl(),
                    spotifyUrl
            );
        }

        return new UserProfileResponse(
                user.getUsername(),
                user.getDisplayName(),
                user.getBio(),
                user.getAvatarUrl(),
                user.getSpotifyProfileUrl(),
                user.getLastfmProfileUrl(),
                user.getCreatedAt(),
                favoriteAlbum,
                currentTrack,
                topAlbums,
                totalReviews
        );
    }

    @Transactional
    public UserProfileResponse updateProfileInfo(String username, UpdateProfileInfoRequest request) {
        User user = userService.getByUsername(username);

        if (request != null) {
            user.setDisplayName(cleanNullable(request.displayName(), 60));
            user.setBio(cleanNullable(request.bio(), 240));
            user.setSpotifyProfileUrl(normalizeSocialUrl(request.spotifyProfileUrl(), "https://open.spotify.com/user/"));
            user.setLastfmProfileUrl(normalizeSocialUrl(request.lastfmProfileUrl(), "https://www.last.fm/user/"));
        }

        userService.save(user);
        return getProfile(username);
    }

    @Transactional
    public UserProfileResponse uploadAvatar(String username, UploadAvatarRequest request) {
        User user = userService.getByUsername(username);
        if (request == null || request.base64Image() == null || request.base64Image().isBlank()) {
            throw new IllegalArgumentException("Imagem inválida.");
        }

        String oldFileId = user.getAvatarFileId();
        ImageKitService.UploadResult uploaded = imageKitService.uploadAvatar(user.getUsername(), request.base64Image());

        user.setAvatarUrl(uploaded.url());
        user.setAvatarFileId(uploaded.fileId());
        userService.save(user);

        if (oldFileId != null && !oldFileId.isBlank()) {
            imageKitService.deleteFileQuietly(oldFileId);
        }

        return getProfile(username);
    }

    @Transactional
    public UserProfileResponse deleteAvatar(String username) {
        User user = userService.getByUsername(username);
        String oldFileId = user.getAvatarFileId();

        user.setAvatarUrl(null);
        user.setAvatarFileId(null);
        userService.save(user);

        if (oldFileId != null && !oldFileId.isBlank()) {
            imageKitService.deleteFileQuietly(oldFileId);
        }

        return getProfile(username);
    }

    private String cleanNullable(String value, int maxLen) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.length() > maxLen ? trimmed.substring(0, maxLen) : trimmed;
    }

    private String normalizeSocialUrl(String raw, String defaultPrefix) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String trimmed = raw.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed;
        }
        String handle = trimmed.startsWith("@") ? trimmed.substring(1).trim() : trimmed;
        if (handle.isEmpty()) {
            return null;
        }
        return defaultPrefix + handle;
    }

    @Transactional
    public UserProfileResponse setCurrentTrack(String username, SetCurrentTrackRequest request) {
        User user = userService.getByUsername(username);

        if (request == null || request.title() == null || request.title().isBlank()) {
            user.setCurrentTrackTitle(null);
            user.setCurrentTrackArtist(null);
            user.setCurrentTrackAlbum(null);
            user.setCurrentTrackCoverUrl(null);
            user.setCurrentTrackPreviewUrl(null);
            user.setCurrentTrackSpotifyUrl(null);
        } else {
            String title = request.title().trim();
            String artist = request.artist() != null ? request.artist().trim() : null;
            user.setCurrentTrackTitle(title);
            user.setCurrentTrackArtist(artist);
            user.setCurrentTrackAlbum(request.albumTitle() != null ? request.albumTitle().trim() : null);
            user.setCurrentTrackCoverUrl(request.coverUrl() != null ? request.coverUrl().trim() : null);
            user.setCurrentTrackPreviewUrl(request.previewUrl() != null ? request.previewUrl().trim() : null);
            String resolvedSpotifyUrl = (request.spotifyUrl() != null && !request.spotifyUrl().isBlank() && !request.spotifyUrl().startsWith("https://open.spotify.com/search/"))
                    ? request.spotifyUrl().trim()
                    : spotifyService.resolveSpotifyTrackUrl(title, artist);
            user.setCurrentTrackSpotifyUrl(resolvedSpotifyUrl);
        }

        userService.save(user);
        return getProfile(username);
    }

    @Transactional
    public UserProfileResponse setFavoriteAlbum(String username, SetFavoriteAlbumRequest request) {
        User user = userService.getByUsername(username);

        if (request == null || request.spotifyId() == null || request.spotifyId().isBlank()) {
            user.setFavoriteAlbumId(null);
        } else {
            AlbumResponse album = catalogService.getOrCreateAlbum(request.spotifyId().trim());
            user.setFavoriteAlbumId(album.id());
        }

        userService.save(user);
        return getProfile(username);
    }

    @Transactional
    public UserProfileResponse updateTopAlbums(String username, UpdateTopAlbumsRequest request) {
        User user = userService.getByUsername(username);

        List<TopAlbumItemRequest> items = request.topAlbums();
        if (items != null && !items.isEmpty()) {
            Set<Integer> positions = new HashSet<>();
            Set<String> spotifyIds = new HashSet<>();

            for (TopAlbumItemRequest item : items) {
                if (!positions.add(item.position())) {
                    throw new IllegalArgumentException("Duplicate position detected in top albums: " + item.position());
                }
                if (!spotifyIds.add(item.spotifyId().trim())) {
                    throw new IllegalArgumentException("Duplicate album detected in top albums: " + item.spotifyId());
                }
            }
        }

        topAlbumRepository.deleteByUserUsername(user.getUsername());
        topAlbumRepository.flush();

        if (items != null) {
            for (TopAlbumItemRequest item : items) {
                AlbumResponse albumDto = catalogService.getOrCreateAlbum(item.spotifyId().trim());
                Album album = catalogService.getAlbumEntityById(albumDto.id());

                TopAlbum topAlbum = TopAlbum.builder()
                        .user(user)
                        .album(album)
                        .position(item.position())
                        .build();

                topAlbumRepository.save(topAlbum);
            }
            topAlbumRepository.flush();
        }

        return getProfile(username);
    }
}
