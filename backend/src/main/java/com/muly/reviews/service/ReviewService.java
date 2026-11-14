package com.muly.reviews.service;

import com.muly.auth.model.User;
import com.muly.auth.service.UserService;
import com.muly.catalog.dto.AlbumResponse;
import com.muly.catalog.dto.ArtistDetailResponse;
import com.muly.catalog.dto.RankedAlbumResponse;
import com.muly.catalog.model.Album;
import com.muly.catalog.service.CatalogService;
import com.muly.common.exception.ResourceNotFoundException;
import com.muly.profile.model.UserFollow;
import com.muly.profile.repository.UserFollowRepository;
import com.muly.reviews.dto.*;
import com.muly.reviews.model.Review;
import com.muly.reviews.model.ReviewComment;
import com.muly.reviews.model.ReviewLike;
import com.muly.reviews.model.TrackReview;
import com.muly.reviews.repository.ReviewCommentRepository;
import com.muly.reviews.repository.ReviewLikeRepository;
import com.muly.reviews.repository.ReviewRepository;
import com.muly.reviews.repository.TrackReviewRepository;
import com.muly.social.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final TrackReviewRepository trackReviewRepository;
    private final ReviewLikeRepository reviewLikeRepository;
    private final ReviewCommentRepository reviewCommentRepository;
    private final UserFollowRepository userFollowRepository;
    private final UserService userService;
    private final CatalogService catalogService;
    private final NotificationService notificationService;

    public ReviewService(
            ReviewRepository reviewRepository,
            TrackReviewRepository trackReviewRepository,
            ReviewLikeRepository reviewLikeRepository,
            ReviewCommentRepository reviewCommentRepository,
            UserFollowRepository userFollowRepository,
            UserService userService,
            CatalogService catalogService,
            NotificationService notificationService
    ) {
        this.reviewRepository = reviewRepository;
        this.trackReviewRepository = trackReviewRepository;
        this.reviewLikeRepository = reviewLikeRepository;
        this.reviewCommentRepository = reviewCommentRepository;
        this.userFollowRepository = userFollowRepository;
        this.userService = userService;
        this.catalogService = catalogService;
        this.notificationService = notificationService;
    }

    private double normalizeRating(Double raw) {
        if (raw == null) {
            throw new IllegalArgumentException("Rating is required.");
        }
        double rounded = Math.round(raw * 2.0) / 2.0;
        if (rounded < 0.5 || rounded > 5.0) {
            throw new IllegalArgumentException("Rating must be between 0.5 and 5.0.");
        }
        return rounded;
    }

    @Transactional
    public ReviewResponse createOrUpdateReview(String username, CreateReviewRequest request) {
        User user = userService.getByUsername(username);
        AlbumResponse albumDto = catalogService.getOrCreateAlbum(request.spotifyId());
        Album album = catalogService.getAlbumEntityById(albumDto.id());
        double normalizedRating = normalizeRating(request.rating());

        if (request.trackNumber() != null) {
            String trackTitle = (request.trackTitle() != null && !request.trackTitle().isBlank())
                    ? request.trackTitle().trim()
                    : "Faixa " + request.trackNumber();

            Optional<TrackReview> existingTrackOpt = trackReviewRepository
                    .findByUserUsernameAndAlbumExternalIdAndTrackNumber(user.getUsername(), album.getExternalId(), request.trackNumber());

            TrackReview trackReview;
            if (existingTrackOpt.isPresent()) {
                trackReview = existingTrackOpt.get();
                trackReview.setTrackTitle(trackTitle);
                trackReview.setRating(normalizedRating);
                trackReview.setReviewText(request.reviewText());
            } else {
                trackReview = TrackReview.builder()
                        .user(user)
                        .album(album)
                        .trackNumber(request.trackNumber())
                        .trackTitle(trackTitle)
                        .rating(normalizedRating)
                        .reviewText(request.reviewText())
                        .build();
            }

            TrackReview savedTrack = trackReviewRepository.save(trackReview);
            return toTrackResponse(savedTrack, user.getUsername());
        }

        Optional<Review> existingOpt = reviewRepository.findByUserUsernameAndAlbumExternalId(user.getUsername(), album.getExternalId());

        Review review;
        if (existingOpt.isPresent()) {
            review = existingOpt.get();
            review.setRating(normalizedRating);
            review.setReviewText(request.reviewText());
        } else {
            review = Review.builder()
                    .user(user)
                    .album(album)
                    .rating(normalizedRating)
                    .reviewText(request.reviewText())
                    .build();
        }

        Review saved = reviewRepository.save(review);
        return toResponse(saved, user.getUsername());
    }

    @Transactional
    public ReviewResponse updateReview(String username, UUID reviewId, UpdateReviewRequest request) {
        double normalizedRating = normalizeRating(request.rating());

        Optional<Review> reviewOpt = reviewRepository.findById(reviewId);
        if (reviewOpt.isPresent()) {
            Review review = reviewOpt.get();
            if (!review.getUser().getUsername().equalsIgnoreCase(username)) {
                throw new IllegalArgumentException("You can only edit your own reviews.");
            }
            review.setRating(normalizedRating);
            review.setReviewText(request.reviewText());
            return toResponse(reviewRepository.save(review), username);
        }

        TrackReview trackReview = trackReviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));

        if (!trackReview.getUser().getUsername().equalsIgnoreCase(username)) {
            throw new IllegalArgumentException("You can only edit your own reviews.");
        }

        trackReview.setRating(normalizedRating);
        trackReview.setReviewText(request.reviewText());
        return toTrackResponse(trackReviewRepository.save(trackReview), username);
    }

    @Transactional
    public void deleteReview(String username, UUID reviewId) {
        Optional<Review> reviewOpt = reviewRepository.findById(reviewId);
        if (reviewOpt.isPresent()) {
            Review review = reviewOpt.get();
            if (!review.getUser().getUsername().equalsIgnoreCase(username)) {
                throw new IllegalArgumentException("You can only delete your own reviews.");
            }
            reviewCommentRepository.deleteByReviewId(reviewId);
            reviewLikeRepository.deleteByReviewId(reviewId);
            reviewRepository.delete(review);
            return;
        }

        TrackReview trackReview = trackReviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));

        if (!trackReview.getUser().getUsername().equalsIgnoreCase(username)) {
            throw new IllegalArgumentException("You can only delete your own reviews.");
        }

        reviewCommentRepository.deleteByReviewId(reviewId);
        reviewLikeRepository.deleteByReviewId(reviewId);
        trackReviewRepository.delete(trackReview);
    }

    @Transactional
    public ReviewResponse toggleLike(String username, UUID reviewId) {
        User actor = userService.getByUsername(username);

        Optional<Review> albumReviewOpt = reviewRepository.findById(reviewId);
        TrackReview trackReview = null;
        User reviewOwner;
        String albumTitle;
        String albumExternalId;

        if (albumReviewOpt.isPresent()) {
            Review r = albumReviewOpt.get();
            reviewOwner = r.getUser();
            albumTitle = r.getAlbum().getTitle();
            albumExternalId = r.getAlbum().getExternalId();
        } else {
            trackReview = trackReviewRepository.findById(reviewId)
                    .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));
            reviewOwner = trackReview.getUser();
            albumTitle = trackReview.getTrackTitle() + " (" + trackReview.getAlbum().getTitle() + ")";
            albumExternalId = trackReview.getAlbum().getExternalId();
        }

        Optional<ReviewLike> existingLike = reviewLikeRepository.findByReviewIdAndUserUsername(reviewId, actor.getUsername());
        if (existingLike.isPresent()) {
            reviewLikeRepository.delete(existingLike.get());
        } else {
            ReviewLike like = ReviewLike.builder()
                    .reviewId(reviewId)
                    .user(actor)
                    .build();
            reviewLikeRepository.save(like);

            notificationService.createNotification(
                    reviewOwner,
                    actor,
                    "REVIEW_LIKE",
                    "curtiu sua avaliação de " + albumTitle,
                    "/reviews/" + reviewId
            );
        }
        reviewLikeRepository.flush();

        if (albumReviewOpt.isPresent()) {
            return toResponse(albumReviewOpt.get(), actor.getUsername());
        }
        return toTrackResponse(trackReview, actor.getUsername());
    }

    @Transactional
    public ReviewCommentResponse addComment(String username, UUID reviewId, CreateReviewCommentRequest request) {
        User actor = userService.getByUsername(username);

        Optional<Review> albumReviewOpt = reviewRepository.findById(reviewId);
        User reviewOwner;
        String albumTitle;
        String albumExternalId;

        if (albumReviewOpt.isPresent()) {
            Review r = albumReviewOpt.get();
            reviewOwner = r.getUser();
            albumTitle = r.getAlbum().getTitle();
            albumExternalId = r.getAlbum().getExternalId();
        } else {
            TrackReview tr = trackReviewRepository.findById(reviewId)
                    .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));
            reviewOwner = tr.getUser();
            albumTitle = tr.getTrackTitle() + " (" + tr.getAlbum().getTitle() + ")";
            albumExternalId = tr.getAlbum().getExternalId();
        }

        String content = request.content().trim();
        ReviewComment comment = ReviewComment.builder()
                .reviewId(reviewId)
                .user(actor)
                .content(content)
                .build();

        ReviewComment saved = reviewCommentRepository.save(comment);

        String snippet = content.length() > 60 ? content.substring(0, 60) + "..." : content;
        notificationService.createNotification(
                reviewOwner,
                actor,
                "REVIEW_COMMENT",
                "comentou na sua avaliação de " + albumTitle + ": \"" + snippet + "\"",
                "/reviews/" + reviewId
        );

        return new ReviewCommentResponse(
                saved.getId(),
                saved.getReviewId(),
                actor.getUsername(),
                actor.getDisplayName(),
                actor.getAvatarUrl(),
                saved.getContent(),
                saved.getCreatedAt()
        );
    }

    @Transactional
    public void deleteComment(String username, UUID reviewId, UUID commentId) {
        ReviewComment comment = reviewCommentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));

        if (!comment.getReviewId().equals(reviewId)) {
            throw new IllegalArgumentException("Comment does not belong to this review.");
        }

        String reviewOwnerUsername = reviewRepository.findById(reviewId)
                .map(r -> r.getUser().getUsername())
                .orElseGet(() -> trackReviewRepository.findById(reviewId)
                        .map(tr -> tr.getUser().getUsername())
                        .orElse(""));

        boolean isCommentAuthor = comment.getUser().getUsername().equalsIgnoreCase(username);
        boolean isReviewOwner = reviewOwnerUsername.equalsIgnoreCase(username);

        if (!isCommentAuthor && !isReviewOwner) {
            throw new IllegalArgumentException("You do not have permission to delete this comment.");
        }

        reviewCommentRepository.delete(comment);
    }

    @Transactional(readOnly = true)
    public AlbumReviewsSummaryResponse getReviewsByAlbum(String externalId) {
        return getReviewsByAlbum(externalId, null);
    }

    @Transactional(readOnly = true)
    public AlbumReviewsSummaryResponse getReviewsByAlbum(String externalId, String viewerUsername) {
        List<Review> reviews = reviewRepository.findByAlbumExternalIdOrderByCreatedAtDesc(externalId);
        List<TrackReview> trackReviews = trackReviewRepository.findByAlbumExternalIdOrderByCreatedAtDesc(externalId);
        Double avg = reviewRepository.findAverageRatingByAlbumExternalId(externalId);
        long count = reviews.size();

        List<ReviewResponse> dtoList = reviews.stream().map(r -> toResponse(r, viewerUsername)).toList();
        List<ReviewResponse> trackDtoList = trackReviews.stream().map(tr -> toTrackResponse(tr, viewerUsername)).toList();

        List<ReviewResponse> friendsReviews = List.of();
        if (viewerUsername != null && !viewerUsername.isBlank()) {
            String normViewer = viewerUsername.trim().toLowerCase(Locale.ROOT);
            Set<String> followingUsernames = userFollowRepository.findByFollowerUsernameOrderByCreatedAtDesc(normViewer)
                    .stream()
                    .map(f -> f.getFollowing().getUsername().toLowerCase(Locale.ROOT))
                    .collect(Collectors.toSet());

            if (!followingUsernames.isEmpty()) {
                List<ReviewResponse> combinedFriends = new ArrayList<>();
                dtoList.stream()
                        .filter(r -> followingUsernames.contains(r.username().toLowerCase(Locale.ROOT)))
                        .forEach(combinedFriends::add);
                trackDtoList.stream()
                        .filter(tr -> followingUsernames.contains(tr.username().toLowerCase(Locale.ROOT)))
                        .forEach(combinedFriends::add);
                friendsReviews = combinedFriends;
            }
        }

        return new AlbumReviewsSummaryResponse(
                avg != null ? Math.round(avg * 10.0) / 10.0 : null,
                count,
                dtoList,
                trackDtoList,
                friendsReviews
        );
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByUser(String username) {
        return getReviewsByUser(username, null);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByUser(String username, String viewerUsername) {
        userService.getByUsername(username);
        String normUser = username.trim().toLowerCase(Locale.ROOT);
        List<ReviewResponse> albumReviews = reviewRepository.findByUserUsernameOrderByCreatedAtDesc(normUser)
                .stream()
                .map(r -> toResponse(r, viewerUsername))
                .toList();
        List<ReviewResponse> trackReviews = trackReviewRepository.findByUserUsernameOrderByCreatedAtDesc(normUser)
                .stream()
                .map(tr -> toTrackResponse(tr, viewerUsername))
                .toList();

        List<ReviewResponse> all = new ArrayList<>(albumReviews.size() + trackReviews.size());
        all.addAll(albumReviews);
        all.addAll(trackReviews);
        all.sort(Comparator.comparing(ReviewResponse::createdAt).reversed());
        return all;
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getFeed(String tab, String viewerUsername) {
        String normViewer = (viewerUsername != null && !viewerUsername.isBlank())
                ? viewerUsername.trim().toLowerCase(Locale.ROOT)
                : null;

        if ("following".equalsIgnoreCase(tab)) {
            if (normViewer == null) {
                return List.of();
            }
            Set<String> followingUsernames = userFollowRepository.findByFollowerUsernameOrderByCreatedAtDesc(normViewer)
                    .stream()
                    .map(UserFollow::getFollowing)
                    .map(u -> u.getUsername().toLowerCase(Locale.ROOT))
                    .collect(Collectors.toSet());

            if (followingUsernames.isEmpty()) {
                return List.of();
            }

            List<ReviewResponse> albumRevs = reviewRepository.findByUserUsernameInOrderByCreatedAtDesc(followingUsernames)
                    .stream()
                    .map(r -> toResponse(r, normViewer))
                    .toList();
            List<ReviewResponse> trackRevs = trackReviewRepository.findByUserUsernameInOrderByCreatedAtDesc(followingUsernames)
                    .stream()
                    .map(tr -> toTrackResponse(tr, normViewer))
                    .toList();

            List<ReviewResponse> combined = new ArrayList<>(albumRevs.size() + trackRevs.size());
            combined.addAll(albumRevs);
            combined.addAll(trackRevs);
            combined.sort(Comparator.comparing(ReviewResponse::createdAt).reversed());
            return combined.stream().limit(30).toList();
        }

        List<ReviewResponse> albumRevs = reviewRepository.findTop40ByOrderByCreatedAtDesc()
                .stream()
                .map(r -> toResponse(r, normViewer))
                .toList();
        List<ReviewResponse> trackRevs = trackReviewRepository.findTop40ByOrderByCreatedAtDesc()
                .stream()
                .map(tr -> toTrackResponse(tr, normViewer))
                .toList();

        List<ReviewResponse> combined = new ArrayList<>(albumRevs.size() + trackRevs.size());
        combined.addAll(albumRevs);
        combined.addAll(trackRevs);

        if ("trending".equalsIgnoreCase(tab)) {
            combined.sort(
                    Comparator.<ReviewResponse>comparingLong(r -> r.likesCount() * 2 + r.commentsCount())
                            .thenComparing(ReviewResponse::createdAt)
                            .reversed()
            );
        } else {
            combined.sort(Comparator.comparing(ReviewResponse::createdAt).reversed());
        }

        return combined.stream().limit(30).toList();
    }

    @Transactional(readOnly = true)
    public ReviewResponse getUserReviewForAlbum(String username, String externalId) {
        String norm = username.trim().toLowerCase(Locale.ROOT);
        return reviewRepository.findByUserUsernameAndAlbumExternalId(norm, externalId)
                .map(r -> toResponse(r, norm))
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getUserTrackReviewsForAlbum(String username, String externalId) {
        String norm = username.trim().toLowerCase(Locale.ROOT);
        return trackReviewRepository
                .findByUserUsernameAndAlbumExternalIdOrderByTrackNumberAsc(norm, externalId)
                .stream()
                .map(tr -> toTrackResponse(tr, norm))
                .toList();
    }

    @Transactional(readOnly = true)
    public ReviewResponse getReviewById(UUID reviewId, String viewerUsername) {
        String normViewer = (viewerUsername != null && !viewerUsername.isBlank())
                ? viewerUsername.trim().toLowerCase(Locale.ROOT)
                : null;

        Optional<Review> reviewOpt = reviewRepository.findById(reviewId);
        if (reviewOpt.isPresent()) {
            return toResponse(reviewOpt.get(), normViewer);
        }

        TrackReview trackReview = trackReviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));

        return toTrackResponse(trackReview, normViewer);
    }

    @Transactional(readOnly = true)
    public long countReviewsByUser(String username) {
        String normalized = username.toLowerCase(Locale.ROOT);
        return reviewRepository.countByUserUsername(normalized) + trackReviewRepository.countByUserUsername(normalized);
    }

    @Transactional(readOnly = true)
    public List<RankedAlbumResponse> getTopRankedAlbums(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        Map<String, AlbumRatingStats> statsByExternalId = buildAlbumRatingStatsMap();

        return statsByExternalId.values().stream()
                .filter(s -> s.ratings.size() > 0)
                .map(s -> toRankedAlbumResponse(catalogService.toResponse(s.album), s))
                .sorted(Comparator
                        .comparing(RankedAlbumResponse::averageRating, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(RankedAlbumResponse::totalReviews, Comparator.reverseOrder())
                        .thenComparing(RankedAlbumResponse::title, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .limit(safeLimit)
                .toList();
    }

    @Transactional(readOnly = true)
    public ArtistDetailResponse getArtistDetail(String artistName) {
        String cleanArtist = artistName != null ? artistName.trim() : "";
        if (cleanArtist.isBlank()) {
            throw new ResourceNotFoundException("Artista não encontrado.");
        }
        String normQuery = cleanArtist.toLowerCase(Locale.ROOT);

        Map<String, AlbumResponse> mergedAlbums = new LinkedHashMap<>();
        for (AlbumResponse local : catalogService.findLocalAlbumsByArtist(cleanArtist)) {
            if (local.externalId() != null) {
                mergedAlbums.put(local.externalId(), local);
            }
        }

        List<AlbumResponse> spotifyAlbums = catalogService.searchAlbums(cleanArtist);
        List<AlbumResponse> filteredSpotify = spotifyAlbums.stream()
                .filter(a -> a.artist() != null && a.artist().toLowerCase(Locale.ROOT).contains(normQuery))
                .toList();
        List<AlbumResponse> toAdd = filteredSpotify.isEmpty() && mergedAlbums.isEmpty() ? spotifyAlbums : filteredSpotify;
        for (AlbumResponse sp : toAdd) {
            if (sp.externalId() != null) {
                mergedAlbums.putIfAbsent(sp.externalId(), sp);
            }
        }

        Map<String, AlbumRatingStats> statsByExternalId = buildAlbumRatingStatsMap();

        long totalArtistReviews = 0L;
        double ratingSum = 0.0;
        List<RankedAlbumResponse> rankedList = new ArrayList<>();

        for (AlbumResponse album : mergedAlbums.values()) {
            AlbumRatingStats stats = statsByExternalId.get(album.externalId());
            if (stats != null && !stats.ratings.isEmpty()) {
                for (double r : stats.ratings) {
                    ratingSum += r;
                }
                totalArtistReviews += stats.ratings.size();
            }
            rankedList.add(toRankedAlbumResponse(album, stats));
        }

        rankedList.sort(Comparator
                .comparing((RankedAlbumResponse a) -> a.averageRating() != null ? 0 : 1)
                .thenComparing(RankedAlbumResponse::averageRating, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(RankedAlbumResponse::totalReviews, Comparator.reverseOrder())
                .thenComparing(RankedAlbumResponse::releaseYear, Comparator.nullsLast(Comparator.reverseOrder())));

        Double artistAvg = totalArtistReviews > 0
                ? Math.round((ratingSum / totalArtistReviews) * 10.0) / 10.0
                : null;

        String displayArtistName = cleanArtist;
        for (RankedAlbumResponse a : rankedList) {
            if (a.artist() != null && a.artist().equalsIgnoreCase(cleanArtist)) {
                displayArtistName = a.artist();
                break;
            }
        }

        return new ArtistDetailResponse(
                displayArtistName,
                rankedList.size(),
                totalArtistReviews,
                artistAvg,
                rankedList
        );
    }

    private static class AlbumRatingStats {
        final Album album;
        final List<Double> ratings = new ArrayList<>();

        AlbumRatingStats(Album album) {
            this.album = album;
        }
    }

    private Map<String, AlbumRatingStats> buildAlbumRatingStatsMap() {
        Map<String, AlbumRatingStats> statsMap = new LinkedHashMap<>();

        List<Review> allReviews = reviewRepository.findAll();
        if (allReviews != null) {
            for (Review r : allReviews) {
                if (r.getAlbum() == null || r.getAlbum().getExternalId() == null) continue;
                statsMap.computeIfAbsent(r.getAlbum().getExternalId(), k -> new AlbumRatingStats(r.getAlbum()))
                        .ratings.add(r.getRating());
            }
        }

        List<TrackReview> allTrackReviews = trackReviewRepository.findAll();
        if (allTrackReviews != null) {
            for (TrackReview tr : allTrackReviews) {
                if (tr.getAlbum() == null || tr.getAlbum().getExternalId() == null) continue;
                statsMap.computeIfAbsent(tr.getAlbum().getExternalId(), k -> new AlbumRatingStats(tr.getAlbum()))
                        .ratings.add(tr.getRating());
            }
        }

        return statsMap;
    }

    private RankedAlbumResponse toRankedAlbumResponse(AlbumResponse album, AlbumRatingStats stats) {
        Double avg = null;
        long total = 0L;
        if (stats != null && !stats.ratings.isEmpty()) {
            total = stats.ratings.size();
            double sum = 0.0;
            for (double r : stats.ratings) {
                sum += r;
            }
            avg = Math.round((sum / total) * 10.0) / 10.0;
        }
        return new RankedAlbumResponse(
                album.id(),
                album.externalId(),
                album.title(),
                album.artist(),
                album.releaseYear(),
                album.coverUrl(),
                avg,
                total
        );
    }

    private ReviewResponse toResponse(Review review, String viewerUsername) {
        UUID revId = review.getId();
        long likesCount = revId != null ? reviewLikeRepository.countByReviewId(revId) : 0L;
        boolean likedByMe = revId != null
                && viewerUsername != null
                && !viewerUsername.isBlank()
                && reviewLikeRepository.existsByReviewIdAndUserUsername(revId, viewerUsername.trim().toLowerCase(Locale.ROOT));

        List<ReviewCommentResponse> comments = revId != null
                ? reviewCommentRepository.findByReviewIdOrderByCreatedAtAsc(revId)
                        .stream()
                        .map(this::toCommentResponse)
                        .toList()
                : List.of();

        return new ReviewResponse(
                revId,
                review.getUser().getUsername(),
                review.getUser().getDisplayName(),
                review.getUser().getAvatarUrl(),
                review.getUser().getBio(),
                review.getUser().getSpotifyProfileUrl(),
                review.getUser().getLastfmProfileUrl(),
                review.getAlbum().getExternalId(),
                review.getAlbum().getTitle(),
                review.getAlbum().getArtist(),
                review.getAlbum().getCoverUrl(),
                review.getAlbum().getReleaseYear(),
                null,
                null,
                review.getRating(),
                review.getReviewText(),
                review.getCreatedAt(),
                review.getUpdatedAt(),
                likesCount,
                likedByMe,
                comments.size(),
                comments
        );
    }

    private ReviewResponse toTrackResponse(TrackReview trackReview, String viewerUsername) {
        UUID revId = trackReview.getId();
        long likesCount = revId != null ? reviewLikeRepository.countByReviewId(revId) : 0L;
        boolean likedByMe = revId != null
                && viewerUsername != null
                && !viewerUsername.isBlank()
                && reviewLikeRepository.existsByReviewIdAndUserUsername(revId, viewerUsername.trim().toLowerCase(Locale.ROOT));

        List<ReviewCommentResponse> comments = revId != null
                ? reviewCommentRepository.findByReviewIdOrderByCreatedAtAsc(revId)
                        .stream()
                        .map(this::toCommentResponse)
                        .toList()
                : List.of();

        return new ReviewResponse(
                revId,
                trackReview.getUser().getUsername(),
                trackReview.getUser().getDisplayName(),
                trackReview.getUser().getAvatarUrl(),
                trackReview.getUser().getBio(),
                trackReview.getUser().getSpotifyProfileUrl(),
                trackReview.getUser().getLastfmProfileUrl(),
                trackReview.getAlbum().getExternalId(),
                trackReview.getAlbum().getTitle(),
                trackReview.getAlbum().getArtist(),
                trackReview.getAlbum().getCoverUrl(),
                trackReview.getAlbum().getReleaseYear(),
                trackReview.getTrackNumber(),
                trackReview.getTrackTitle(),
                trackReview.getRating(),
                trackReview.getReviewText(),
                trackReview.getCreatedAt(),
                trackReview.getUpdatedAt(),
                likesCount,
                likedByMe,
                comments.size(),
                comments
        );
    }

    private ReviewCommentResponse toCommentResponse(ReviewComment c) {
        return new ReviewCommentResponse(
                c.getId(),
                c.getReviewId(),
                c.getUser().getUsername(),
                c.getUser().getDisplayName(),
                c.getUser().getAvatarUrl(),
                c.getContent(),
                c.getCreatedAt()
        );
    }
}
