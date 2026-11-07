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
import com.muly.profile.model.UserFollow;
import com.muly.profile.repository.TopAlbumRepository;
import com.muly.profile.repository.UserFollowRepository;
import com.muly.reviews.model.Review;
import com.muly.reviews.model.TrackReview;
import com.muly.reviews.repository.ReviewRepository;
import com.muly.reviews.repository.TrackReviewRepository;
import com.muly.reviews.service.ReviewService;
import com.muly.social.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProfileService {

    private final TopAlbumRepository topAlbumRepository;
    private final UserFollowRepository userFollowRepository;
    private final ReviewRepository reviewRepository;
    private final TrackReviewRepository trackReviewRepository;
    private final UserService userService;
    private final CatalogService catalogService;
    private final ReviewService reviewService;
    private final SpotifyService spotifyService;
    private final ImageKitService imageKitService;
    private final NotificationService notificationService;

    public ProfileService(
            TopAlbumRepository topAlbumRepository,
            UserFollowRepository userFollowRepository,
            ReviewRepository reviewRepository,
            TrackReviewRepository trackReviewRepository,
            UserService userService,
            CatalogService catalogService,
            ReviewService reviewService,
            SpotifyService spotifyService,
            ImageKitService imageKitService,
            NotificationService notificationService
    ) {
        this.topAlbumRepository = topAlbumRepository;
        this.userFollowRepository = userFollowRepository;
        this.reviewRepository = reviewRepository;
        this.trackReviewRepository = trackReviewRepository;
        this.userService = userService;
        this.catalogService = catalogService;
        this.reviewService = reviewService;
        this.spotifyService = spotifyService;
        this.imageKitService = imageKitService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String username) {
        return getProfile(username, null);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String username, String viewerUsername) {
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
        long followersCount = userFollowRepository.countByFollowingUsername(user.getUsername());
        long followingCount = userFollowRepository.countByFollowerUsername(user.getUsername());

        boolean followedByMe = false;
        boolean followsMe = false;
        Integer tasteMatchPercentage = null;
        int commonItemsCount = 0;

        if (viewerUsername != null && !viewerUsername.isBlank()) {
            String normViewer = viewerUsername.trim().toLowerCase(Locale.ROOT);
            if (!normViewer.equals(user.getUsername())) {
                followedByMe = userFollowRepository.existsByFollowerUsernameAndFollowingUsername(normViewer, user.getUsername());
                followsMe = userFollowRepository.existsByFollowerUsernameAndFollowingUsername(user.getUsername(), normViewer);
                TasteMatchResult match = computeTasteMatch(normViewer, user, topEntities);
                tasteMatchPercentage = match.percentage();
                commonItemsCount = match.commonCount();
            }
        }

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
                totalReviews,
                followersCount,
                followingCount,
                followedByMe,
                followsMe,
                tasteMatchPercentage,
                commonItemsCount
        );
    }

    private record TasteMatchResult(Integer percentage, int commonCount) {}

    private TasteMatchResult computeTasteMatch(String viewerUsername, User targetUser, List<TopAlbum> targetTopEntities) {
        try {
            User viewerUser = userService.getByUsername(viewerUsername);
            List<Review> targetAlbumRevs = reviewRepository.findByUserUsernameOrderByCreatedAtDesc(targetUser.getUsername());
            List<Review> viewerAlbumRevs = reviewRepository.findByUserUsernameOrderByCreatedAtDesc(viewerUser.getUsername());

            List<TrackReview> targetTrackRevs = trackReviewRepository.findByUserUsernameOrderByCreatedAtDesc(targetUser.getUsername());
            List<TrackReview> viewerTrackRevs = trackReviewRepository.findByUserUsernameOrderByCreatedAtDesc(viewerUser.getUsername());

            List<TopAlbum> viewerTopEntities = topAlbumRepository.findByUserUsernameOrderByPositionAsc(viewerUser.getUsername());

            Map<String, Double> targetAlbumRatings = new HashMap<>();
            Map<String, List<Double>> targetArtistRatings = new HashMap<>();
            for (Review r : targetAlbumRevs) {
                targetAlbumRatings.put(r.getAlbum().getExternalId(), r.getRating());
                if (r.getAlbum().getArtist() != null) {
                    targetArtistRatings.computeIfAbsent(r.getAlbum().getArtist().trim().toLowerCase(Locale.ROOT), k -> new ArrayList<>())
                            .add(r.getRating());
                }
            }

            Map<String, Double> viewerAlbumRatings = new HashMap<>();
            Map<String, List<Double>> viewerArtistRatings = new HashMap<>();
            for (Review r : viewerAlbumRevs) {
                viewerAlbumRatings.put(r.getAlbum().getExternalId(), r.getRating());
                if (r.getAlbum().getArtist() != null) {
                    viewerArtistRatings.computeIfAbsent(r.getAlbum().getArtist().trim().toLowerCase(Locale.ROOT), k -> new ArrayList<>())
                            .add(r.getRating());
                }
            }

            Map<String, Double> targetTrackRatings = new HashMap<>();
            for (TrackReview tr : targetTrackRevs) {
                String key = tr.getAlbum().getExternalId() + "#" + tr.getTrackNumber();
                targetTrackRatings.put(key, tr.getRating());
                if (tr.getAlbum().getArtist() != null) {
                    targetArtistRatings.computeIfAbsent(tr.getAlbum().getArtist().trim().toLowerCase(Locale.ROOT), k -> new ArrayList<>())
                            .add(tr.getRating());
                }
            }

            Map<String, Double> viewerTrackRatings = new HashMap<>();
            for (TrackReview tr : viewerTrackRevs) {
                String key = tr.getAlbum().getExternalId() + "#" + tr.getTrackNumber();
                viewerTrackRatings.put(key, tr.getRating());
                if (tr.getAlbum().getArtist() != null) {
                    viewerArtistRatings.computeIfAbsent(tr.getAlbum().getArtist().trim().toLowerCase(Locale.ROOT), k -> new ArrayList<>())
                            .add(tr.getRating());
                }
            }

            Set<String> targetFavExternalIds = new HashSet<>();
            for (TopAlbum top : targetTopEntities) {
                targetFavExternalIds.add(top.getAlbum().getExternalId());
                if (top.getAlbum().getArtist() != null) {
                    targetArtistRatings.computeIfAbsent(top.getAlbum().getArtist().trim().toLowerCase(Locale.ROOT), k -> new ArrayList<>())
                            .add(5.0);
                }
            }
            if (targetUser.getFavoriteAlbumId() != null) {
                try {
                    AlbumResponse fav = catalogService.getAlbumById(targetUser.getFavoriteAlbumId());
                    targetFavExternalIds.add(fav.externalId());
                    if (fav.artist() != null) {
                        targetArtistRatings.computeIfAbsent(fav.artist().trim().toLowerCase(Locale.ROOT), k -> new ArrayList<>())
                                .add(5.0);
                    }
                } catch (ResourceNotFoundException ignored) {
                }
            }

            Set<String> viewerFavExternalIds = new HashSet<>();
            for (TopAlbum top : viewerTopEntities) {
                viewerFavExternalIds.add(top.getAlbum().getExternalId());
                if (top.getAlbum().getArtist() != null) {
                    viewerArtistRatings.computeIfAbsent(top.getAlbum().getArtist().trim().toLowerCase(Locale.ROOT), k -> new ArrayList<>())
                            .add(5.0);
                }
            }
            if (viewerUser.getFavoriteAlbumId() != null) {
                try {
                    AlbumResponse fav = catalogService.getAlbumById(viewerUser.getFavoriteAlbumId());
                    viewerFavExternalIds.add(fav.externalId());
                    if (fav.artist() != null) {
                        viewerArtistRatings.computeIfAbsent(fav.artist().trim().toLowerCase(Locale.ROOT), k -> new ArrayList<>())
                                .add(5.0);
                    }
                } catch (ResourceNotFoundException ignored) {
                }
            }

            List<Double> similarities = new ArrayList<>();
            Set<String> countedAlbums = new HashSet<>();

            // 1. Common rated albums
            for (Map.Entry<String, Double> entry : targetAlbumRatings.entrySet()) {
                String extId = entry.getKey();
                if (viewerAlbumRatings.containsKey(extId)) {
                    double diff = Math.abs(entry.getValue() - viewerAlbumRatings.get(extId));
                    similarities.add(Math.max(0.0, 1.0 - (diff / 4.5)));
                    countedAlbums.add(extId);
                }
            }

            // 2. Common rated tracks
            for (Map.Entry<String, Double> entry : targetTrackRatings.entrySet()) {
                String trackKey = entry.getKey();
                if (viewerTrackRatings.containsKey(trackKey)) {
                    double diff = Math.abs(entry.getValue() - viewerTrackRatings.get(trackKey));
                    similarities.add(Math.max(0.0, 1.0 - (diff / 4.5)));
                }
            }

            // 3. Shared or cross-rated Top 4 / Favorite albums
            for (String extId : targetFavExternalIds) {
                if (countedAlbums.contains(extId)) {
                    continue;
                }
                if (viewerFavExternalIds.contains(extId)) {
                    similarities.add(1.0);
                    countedAlbums.add(extId);
                } else if (viewerAlbumRatings.containsKey(extId)) {
                    similarities.add(viewerAlbumRatings.get(extId) / 5.0);
                    countedAlbums.add(extId);
                }
            }
            for (String extId : viewerFavExternalIds) {
                if (countedAlbums.contains(extId)) {
                    continue;
                }
                if (targetAlbumRatings.containsKey(extId)) {
                    similarities.add(targetAlbumRatings.get(extId) / 5.0);
                    countedAlbums.add(extId);
                }
            }

            // 4. Shared artists
            for (Map.Entry<String, List<Double>> entry : targetArtistRatings.entrySet()) {
                String artist = entry.getKey();
                if (viewerArtistRatings.containsKey(artist)) {
                    double avg1 = entry.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(4.0);
                    double avg2 = viewerArtistRatings.get(artist).stream().mapToDouble(Double::doubleValue).average().orElse(4.0);
                    double diff = Math.abs(avg1 - avg2);
                    similarities.add(Math.max(0.0, 1.0 - (diff / 4.5)));
                }
            }

            if (similarities.isEmpty()) {
                return new TasteMatchResult(null, 0);
            }

            double avgSim = similarities.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            int pct = (int) Math.round(avgSim * 100.0);
            pct = Math.max(5, Math.min(100, pct));
            return new TasteMatchResult(pct, similarities.size());
        } catch (Exception e) {
            return new TasteMatchResult(null, 0);
        }
    }

    @Transactional
    public UserProfileResponse toggleFollow(String followerUsername, String targetUsername) {
        String normFollower = followerUsername.trim().toLowerCase(Locale.ROOT);
        String normTarget = targetUsername.trim().toLowerCase(Locale.ROOT);

        if (normFollower.equals(normTarget)) {
            throw new IllegalArgumentException("Você não pode seguir a si mesmo.");
        }

        User follower = userService.getByUsername(normFollower);
        User target = userService.getByUsername(normTarget);

        Optional<UserFollow> existing = userFollowRepository.findByFollowerUsernameAndFollowingUsername(
                follower.getUsername(),
                target.getUsername()
        );

        if (existing.isPresent()) {
            userFollowRepository.delete(existing.get());
        } else {
            UserFollow follow = UserFollow.builder()
                    .follower(follower)
                    .following(target)
                    .build();
            userFollowRepository.save(follow);

            notificationService.createNotification(
                    target,
                    follower,
                    "FOLLOW",
                    "começou a seguir você",
                    "/profile/" + follower.getUsername()
            );
        }
        userFollowRepository.flush();

        return getProfile(target.getUsername(), follower.getUsername());
    }

    @Transactional(readOnly = true)
    public List<FollowUserResponse> getFollowers(String username, String viewerUsername) {
        User user = userService.getByUsername(username);
        Set<String> viewerFollowing = getViewerFollowingSet(viewerUsername);

        return userFollowRepository.findByFollowingUsernameOrderByCreatedAtDesc(user.getUsername())
                .stream()
                .map(UserFollow::getFollower)
                .map(u -> new FollowUserResponse(
                        u.getUsername(),
                        u.getDisplayName(),
                        u.getAvatarUrl(),
                        u.getBio(),
                        viewerFollowing.contains(u.getUsername().toLowerCase(Locale.ROOT))
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FollowUserResponse> getFollowing(String username, String viewerUsername) {
        User user = userService.getByUsername(username);
        Set<String> viewerFollowing = getViewerFollowingSet(viewerUsername);

        return userFollowRepository.findByFollowerUsernameOrderByCreatedAtDesc(user.getUsername())
                .stream()
                .map(UserFollow::getFollowing)
                .map(u -> new FollowUserResponse(
                        u.getUsername(),
                        u.getDisplayName(),
                        u.getAvatarUrl(),
                        u.getBio(),
                        viewerFollowing.contains(u.getUsername().toLowerCase(Locale.ROOT))
                ))
                .toList();
    }

    private Set<String> getViewerFollowingSet(String viewerUsername) {
        if (viewerUsername == null || viewerUsername.isBlank()) {
            return Set.of();
        }
        String normViewer = viewerUsername.trim().toLowerCase(Locale.ROOT);
        return userFollowRepository.findByFollowerUsernameOrderByCreatedAtDesc(normViewer)
                .stream()
                .map(f -> f.getFollowing().getUsername().toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());
    }

    @Transactional
    public UserProfileResponse updateFullProfile(String username, UpdateFullProfileRequest request) {
        if (request == null) {
            return getProfile(username, username);
        }

        updateProfileInfo(username, new UpdateProfileInfoRequest(
                request.displayName(),
                request.bio(),
                request.spotifyProfileUrl(),
                request.lastfmProfileUrl()
        ));

        setFavoriteAlbum(username, new SetFavoriteAlbumRequest(request.favoriteAlbumSpotifyId()));

        if (request.currentTrack() != null) {
            setCurrentTrack(username, request.currentTrack());
        } else {
            setCurrentTrack(username, new SetCurrentTrackRequest(null, null, null, null, null, null));
        }

        updateTopAlbums(username, new UpdateTopAlbumsRequest(
                request.topAlbums() != null ? request.topAlbums() : List.of()
        ));

        return getProfile(username, username);
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
