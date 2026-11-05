package com.muly.profile.service;

import com.muly.auth.model.User;
import com.muly.auth.service.UserService;
import com.muly.catalog.dto.AlbumResponse;
import com.muly.catalog.model.Album;
import com.muly.catalog.service.CatalogService;
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

    public ProfileService(
            TopAlbumRepository topAlbumRepository,
            UserService userService,
            CatalogService catalogService,
            ReviewService reviewService
    ) {
        this.topAlbumRepository = topAlbumRepository;
        this.userService = userService;
        this.catalogService = catalogService;
        this.reviewService = reviewService;
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
            currentTrack = new CurrentTrackResponse(
                    user.getCurrentTrackTitle(),
                    user.getCurrentTrackArtist(),
                    user.getCurrentTrackAlbum(),
                    user.getCurrentTrackCoverUrl(),
                    user.getCurrentTrackPreviewUrl()
            );
        }

        return new UserProfileResponse(
                user.getUsername(),
                user.getCreatedAt(),
                favoriteAlbum,
                currentTrack,
                topAlbums,
                totalReviews
        );
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
        } else {
            user.setCurrentTrackTitle(request.title().trim());
            user.setCurrentTrackArtist(request.artist() != null ? request.artist().trim() : null);
            user.setCurrentTrackAlbum(request.albumTitle() != null ? request.albumTitle().trim() : null);
            user.setCurrentTrackCoverUrl(request.coverUrl() != null ? request.coverUrl().trim() : null);
            user.setCurrentTrackPreviewUrl(request.previewUrl() != null ? request.previewUrl().trim() : null);
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
