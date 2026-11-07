package com.muly.reviews.service;

import com.muly.auth.model.User;
import com.muly.auth.service.UserService;
import com.muly.catalog.dto.AlbumResponse;
import com.muly.catalog.model.Album;
import com.muly.catalog.service.CatalogService;
import com.muly.common.exception.ResourceNotFoundException;
import com.muly.reviews.dto.AlbumReviewsSummaryResponse;
import com.muly.reviews.dto.CreateReviewRequest;
import com.muly.reviews.dto.ReviewResponse;
import com.muly.reviews.dto.UpdateReviewRequest;
import com.muly.reviews.model.Review;
import com.muly.reviews.model.TrackReview;
import com.muly.reviews.repository.ReviewRepository;
import com.muly.reviews.repository.TrackReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final TrackReviewRepository trackReviewRepository;
    private final UserService userService;
    private final CatalogService catalogService;

    public ReviewService(
            ReviewRepository reviewRepository,
            TrackReviewRepository trackReviewRepository,
            UserService userService,
            CatalogService catalogService
    ) {
        this.reviewRepository = reviewRepository;
        this.trackReviewRepository = trackReviewRepository;
        this.userService = userService;
        this.catalogService = catalogService;
    }

    @Transactional
    public ReviewResponse createOrUpdateReview(String username, CreateReviewRequest request) {
        User user = userService.getByUsername(username);
        AlbumResponse albumDto = catalogService.getOrCreateAlbum(request.spotifyId());
        Album album = catalogService.getAlbumEntityById(albumDto.id());

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
                trackReview.setRating(request.rating());
                trackReview.setReviewText(request.reviewText());
            } else {
                trackReview = TrackReview.builder()
                        .user(user)
                        .album(album)
                        .trackNumber(request.trackNumber())
                        .trackTitle(trackTitle)
                        .rating(request.rating())
                        .reviewText(request.reviewText())
                        .build();
            }

            TrackReview savedTrack = trackReviewRepository.save(trackReview);
            return toTrackResponse(savedTrack);
        }

        Optional<Review> existingOpt = reviewRepository.findByUserUsernameAndAlbumExternalId(user.getUsername(), album.getExternalId());

        Review review;
        if (existingOpt.isPresent()) {
            review = existingOpt.get();
            review.setRating(request.rating());
            review.setReviewText(request.reviewText());
        } else {
            review = Review.builder()
                    .user(user)
                    .album(album)
                    .rating(request.rating())
                    .reviewText(request.reviewText())
                    .build();
        }

        Review saved = reviewRepository.save(review);
        return toResponse(saved);
    }

    @Transactional
    public ReviewResponse updateReview(String username, UUID reviewId, UpdateReviewRequest request) {
        Optional<Review> reviewOpt = reviewRepository.findById(reviewId);
        if (reviewOpt.isPresent()) {
            Review review = reviewOpt.get();
            if (!review.getUser().getUsername().equalsIgnoreCase(username)) {
                throw new IllegalArgumentException("You can only edit your own reviews.");
            }
            review.setRating(request.rating());
            review.setReviewText(request.reviewText());
            return toResponse(reviewRepository.save(review));
        }

        TrackReview trackReview = trackReviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));

        if (!trackReview.getUser().getUsername().equalsIgnoreCase(username)) {
            throw new IllegalArgumentException("You can only edit your own reviews.");
        }

        trackReview.setRating(request.rating());
        trackReview.setReviewText(request.reviewText());
        return toTrackResponse(trackReviewRepository.save(trackReview));
    }

    @Transactional
    public void deleteReview(String username, UUID reviewId) {
        Optional<Review> reviewOpt = reviewRepository.findById(reviewId);
        if (reviewOpt.isPresent()) {
            Review review = reviewOpt.get();
            if (!review.getUser().getUsername().equalsIgnoreCase(username)) {
                throw new IllegalArgumentException("You can only delete your own reviews.");
            }
            reviewRepository.delete(review);
            return;
        }

        TrackReview trackReview = trackReviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));

        if (!trackReview.getUser().getUsername().equalsIgnoreCase(username)) {
            throw new IllegalArgumentException("You can only delete your own reviews.");
        }

        trackReviewRepository.delete(trackReview);
    }

    @Transactional(readOnly = true)
    public AlbumReviewsSummaryResponse getReviewsByAlbum(String externalId) {
        List<Review> reviews = reviewRepository.findByAlbumExternalIdOrderByCreatedAtDesc(externalId);
        List<TrackReview> trackReviews = trackReviewRepository.findByAlbumExternalIdOrderByCreatedAtDesc(externalId);
        Double avg = reviewRepository.findAverageRatingByAlbumExternalId(externalId);
        long count = reviews.size();

        List<ReviewResponse> dtoList = reviews.stream().map(this::toResponse).toList();
        List<ReviewResponse> trackDtoList = trackReviews.stream().map(this::toTrackResponse).toList();
        return new AlbumReviewsSummaryResponse(
                avg != null ? Math.round(avg * 10.0) / 10.0 : null,
                count,
                dtoList,
                trackDtoList
        );
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByUser(String username) {
        userService.getByUsername(username);
        List<ReviewResponse> albumReviews = reviewRepository.findByUserUsernameOrderByCreatedAtDesc(username.toLowerCase())
                .stream()
                .map(this::toResponse)
                .toList();
        List<ReviewResponse> trackReviews = trackReviewRepository.findByUserUsernameOrderByCreatedAtDesc(username.toLowerCase())
                .stream()
                .map(this::toTrackResponse)
                .toList();

        List<ReviewResponse> all = new ArrayList<>(albumReviews.size() + trackReviews.size());
        all.addAll(albumReviews);
        all.addAll(trackReviews);
        all.sort(Comparator.comparing(ReviewResponse::createdAt).reversed());
        return all;
    }

    @Transactional(readOnly = true)
    public ReviewResponse getUserReviewForAlbum(String username, String externalId) {
        return reviewRepository.findByUserUsernameAndAlbumExternalId(username.toLowerCase(), externalId)
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getUserTrackReviewsForAlbum(String username, String externalId) {
        return trackReviewRepository
                .findByUserUsernameAndAlbumExternalIdOrderByTrackNumberAsc(username.toLowerCase(), externalId)
                .stream()
                .map(this::toTrackResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long countReviewsByUser(String username) {
        String normalized = username.toLowerCase();
        return reviewRepository.countByUserUsername(normalized) + trackReviewRepository.countByUserUsername(normalized);
    }

    private ReviewResponse toResponse(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getUser().getUsername(),
                review.getUser().getDisplayName(),
                review.getUser().getAvatarUrl(),
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
                review.getUpdatedAt()
        );
    }

    private ReviewResponse toTrackResponse(TrackReview trackReview) {
        return new ReviewResponse(
                trackReview.getId(),
                trackReview.getUser().getUsername(),
                trackReview.getUser().getDisplayName(),
                trackReview.getUser().getAvatarUrl(),
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
                trackReview.getUpdatedAt()
        );
    }
}
