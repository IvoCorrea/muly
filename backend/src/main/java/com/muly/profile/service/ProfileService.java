package com.muly.profile.service;

import com.muly.auth.model.User;
import com.muly.auth.service.UserService;
import com.muly.catalog.dto.AlbumResponse;
import com.muly.catalog.model.Album;
import com.muly.catalog.service.CatalogService;
import com.muly.catalog.service.SpotifyService;
import com.muly.common.exception.ResourceNotFoundException;
import com.muly.profile.dto.*;
import com.muly.profile.model.ListenLaterItem;
import com.muly.profile.model.TopAlbum;
import com.muly.profile.model.UserFollow;
import com.muly.profile.repository.ListenLaterRepository;
import com.muly.profile.repository.TopAlbumRepository;
import com.muly.profile.repository.UserFollowRepository;
import com.muly.reviews.model.Review;
import com.muly.reviews.model.TrackReview;
import com.muly.reviews.repository.ReviewRepository;
import com.muly.reviews.repository.TrackReviewRepository;
import com.muly.reviews.service.ReviewService;
import com.muly.social.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ProfileService {

    private static final Pattern LASTFM_ALBUM_LINK_PATTERN =
            Pattern.compile("href=[\"']/music/([^/\"'?#]+)/([^/\"'?#]+)[\"']");

    private final TopAlbumRepository topAlbumRepository;
    private final UserFollowRepository userFollowRepository;
    private final ListenLaterRepository listenLaterRepository;
    private final ReviewRepository reviewRepository;
    private final TrackReviewRepository trackReviewRepository;
    private final UserService userService;
    private final CatalogService catalogService;
    private final ReviewService reviewService;
    private final SpotifyService spotifyService;
    private final ImageKitService imageKitService;
    private final NotificationService notificationService;
    private final RestClient restClient;

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
        this(
                topAlbumRepository,
                userFollowRepository,
                null,
                reviewRepository,
                trackReviewRepository,
                userService,
                catalogService,
                reviewService,
                spotifyService,
                imageKitService,
                notificationService
        );
    }

    @Autowired
    public ProfileService(
            TopAlbumRepository topAlbumRepository,
            UserFollowRepository userFollowRepository,
            ListenLaterRepository listenLaterRepository,
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
        this.listenLaterRepository = listenLaterRepository;
        this.reviewRepository = reviewRepository;
        this.trackReviewRepository = trackReviewRepository;
        this.userService = userService;
        this.catalogService = catalogService;
        this.reviewService = reviewService;
        this.spotifyService = spotifyService;
        this.imageKitService = imageKitService;
        this.notificationService = notificationService;
        this.restClient = RestClient.builder()
                .requestFactory(new SimpleClientHttpRequestFactory())
                .build();
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

        List<ProfileBadgeResponse> badges = computeBadges(
                user,
                favoriteAlbum,
                currentTrack,
                topEntities,
                followersCount
        );

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
                commonItemsCount,
                badges
        );
    }

    private List<ProfileBadgeResponse> computeBadges(
            User user,
            AlbumResponse favoriteAlbum,
            CurrentTrackResponse currentTrack,
            List<TopAlbum> topEntities,
            long followersCount
    ) {
        List<ProfileBadgeResponse> badges = new ArrayList<>();
        badges.add(new ProfileBadgeResponse(
                "pioneer",
                "🌱",
                "Membro Pioneiro",
                "Faz parte da geração fundadora do Muly"
        ));

        List<Review> albumRevs = reviewRepository.findByUserUsernameOrderByCreatedAtDesc(user.getUsername());
        List<TrackReview> trackRevs = trackReviewRepository.findByUserUsernameOrderByCreatedAtDesc(user.getUsername());

        if (!albumRevs.isEmpty()) {
            badges.add(new ProfileBadgeResponse(
                    "first_review",
                    "✍️",
                    "Primeira Crítica",
                    "Publicou sua primeira avaliação de álbum"
            ));
        }

        if (albumRevs.size() >= 10) {
            badges.add(new ProfileBadgeResponse(
                    "album_critic",
                    "💿",
                    "Crítico de Álbuns",
                    "Avaliou 10 ou mais álbuns no Muly"
            ));
        }

        if (trackRevs.size() >= 5) {
            badges.add(new ProfileBadgeResponse(
                    "track_critic",
                    "🎵",
                    "Ouvido Absoluto",
                    "Avaliou 5 ou mais faixas individuais"
            ));
        }

        Set<String> distinctArtists = new HashSet<>();
        for (Review r : albumRevs) {
            if (r.getAlbum() != null && r.getAlbum().getArtist() != null && !r.getAlbum().getArtist().isBlank()) {
                distinctArtists.add(r.getAlbum().getArtist().trim().toLowerCase(Locale.ROOT));
            }
        }
        for (TrackReview tr : trackRevs) {
            if (tr.getAlbum() != null && tr.getAlbum().getArtist() != null && !tr.getAlbum().getArtist().isBlank()) {
                distinctArtists.add(tr.getAlbum().getArtist().trim().toLowerCase(Locale.ROOT));
            }
        }
        for (TopAlbum top : topEntities) {
            if (top.getAlbum() != null && top.getAlbum().getArtist() != null && !top.getAlbum().getArtist().isBlank()) {
                distinctArtists.add(top.getAlbum().getArtist().trim().toLowerCase(Locale.ROOT));
            }
        }
        if (favoriteAlbum != null && favoriteAlbum.artist() != null && !favoriteAlbum.artist().isBlank()) {
            distinctArtists.add(favoriteAlbum.artist().trim().toLowerCase(Locale.ROOT));
        }
        if (distinctArtists.size() >= 5) {
            badges.add(new ProfileBadgeResponse(
                    "eclectic",
                    "🌍",
                    "Eclético",
                    "Avaliou obras de 5 ou mais artistas diferentes"
            ));
        }

        if (favoriteAlbum != null && topEntities.size() == 4 && currentTrack != null) {
            badges.add(new ProfileBadgeResponse(
                    "complete_profile",
                    "✨",
                    "Identidade Sonora",
                    "Completou Álbum Favorito, Top 4 e Música do Momento"
            ));
        }

        if (followersCount >= 3) {
            badges.add(new ProfileBadgeResponse(
                    "influencer",
                    "🔥",
                    "Influente",
                    "Conquistou seguidores na comunidade Muly"
            ));
        }

        return badges;
    }

    @Transactional(readOnly = true)
    public List<AlbumResponse> getListenLater(String username) {
        if (listenLaterRepository == null) {
            return List.of();
        }
        User user = userService.getByUsername(username);
        return listenLaterRepository.findByUserUsernameOrderByCreatedAtDesc(user.getUsername())
                .stream()
                .map(item -> catalogService.toResponse(item.getAlbum()))
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean isSavedInListenLater(String username, String spotifyId) {
        if (listenLaterRepository == null || spotifyId == null || spotifyId.isBlank()) {
            return false;
        }
        User user = userService.getByUsername(username);
        return listenLaterRepository.existsByUserUsernameAndAlbumExternalId(user.getUsername(), spotifyId.trim());
    }

    @Transactional
    public boolean toggleListenLater(String username, String spotifyId) {
        if (listenLaterRepository == null) {
            return false;
        }
        User user = userService.getByUsername(username);
        String cleanId = spotifyId.trim();

        Optional<ListenLaterItem> existing = listenLaterRepository
                .findByUserUsernameAndAlbumExternalId(user.getUsername(), cleanId);

        if (existing.isPresent()) {
            listenLaterRepository.delete(existing.get());
            return false;
        }

        AlbumResponse albumDto = catalogService.getOrCreateAlbum(cleanId);
        Album album = catalogService.getAlbumEntityById(albumDto.id());
        ListenLaterItem item = ListenLaterItem.builder()
                .user(user)
                .album(album)
                .build();
        listenLaterRepository.save(item);
        return true;
    }

    public List<AlbumResponse> importLastfmTopAlbums(String lastfmUserOrUrl) {
        String lastfmUsername = extractLastfmUsername(lastfmUserOrUrl);

        List<String[]> pairs = fetchLastfmAlbumPairs("https://www.last.fm/user/" + lastfmUsername + "/library/albums");
        if (pairs.isEmpty()) {
            pairs = fetchLastfmAlbumPairs("https://www.last.fm/user/" + lastfmUsername);
        }

        List<AlbumResponse> matchedAlbums = new ArrayList<>();
        Set<String> seenExternalIds = new HashSet<>();

        for (String[] pair : pairs) {
            if (matchedAlbums.size() >= 4) {
                break;
            }
            String artist = pair[0];
            String albumTitle = pair[1];

            List<AlbumResponse> results = catalogService.searchAlbums(albumTitle + " " + artist);
            if (results.isEmpty()) {
                results = catalogService.searchAlbums(albumTitle);
            }

            for (AlbumResponse candidate : results) {
                if (candidate.externalId() != null && seenExternalIds.add(candidate.externalId())) {
                    matchedAlbums.add(candidate);
                    break;
                }
            }
        }

        return matchedAlbums;
    }

    private String extractLastfmUsername(String input) {
        if (input == null || input.isBlank()) {
            throw new IllegalArgumentException("Informe seu usuário ou link do Last.fm.");
        }
        String trimmed = input.trim();
        int idx = trimmed.toLowerCase(Locale.ROOT).indexOf("last.fm/user/");
        if (idx >= 0) {
            String after = trimmed.substring(idx + "last.fm/user/".length());
            int slash = after.indexOf('/');
            if (slash >= 0) after = after.substring(0, slash);
            int q = after.indexOf('?');
            if (q >= 0) after = after.substring(0, q);
            trimmed = after;
        }
        if (trimmed.startsWith("@")) {
            trimmed = trimmed.substring(1);
        }
        trimmed = trimmed.replaceAll("[^a-zA-Z0-9_.-]", "").trim();
        if (trimmed.isBlank()) {
            throw new IllegalArgumentException("Usuário do Last.fm inválido.");
        }
        return trimmed;
    }

    private List<String[]> fetchLastfmAlbumPairs(String url) {
        try {
            String html = restClient.get()
                    .uri(url)
                    .header(HttpHeaders.USER_AGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .retrieve()
                    .body(String.class);

            if (html == null || html.isBlank()) {
                return List.of();
            }

            List<String[]> pairs = new ArrayList<>();
            Set<String> seenKeys = new HashSet<>();
            Matcher matcher = LASTFM_ALBUM_LINK_PATTERN.matcher(html);

            while (matcher.find() && pairs.size() < 8) {
                String rawArtist = matcher.group(1);
                String rawAlbum = matcher.group(2);
                if (rawArtist.startsWith("+") || rawAlbum.startsWith("+") || "_".equals(rawAlbum)) {
                    continue;
                }
                String artist = URLDecoder.decode(rawArtist, StandardCharsets.UTF_8).trim();
                String album = URLDecoder.decode(rawAlbum, StandardCharsets.UTF_8).trim();
                if (artist.isBlank() || album.isBlank()) {
                    continue;
                }
                String key = (artist + "|" + album).toLowerCase(Locale.ROOT);
                if (seenKeys.add(key)) {
                    pairs.add(new String[]{artist, album});
                }
            }
            return pairs;
        } catch (Exception e) {
            return List.of();
        }
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
