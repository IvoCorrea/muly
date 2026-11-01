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
import com.muly.reviews.repository.ReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserService userService;
    private final CatalogService catalogService;

    public ReviewService(ReviewRepository reviewRepository, UserService userService, CatalogService catalogService) {
        this.reviewRepository = reviewRepository;
        this.userService = userService;
        this.catalogService = catalogService;
    }

    @Transactional
    public ReviewResponse createOrUpdateReview(String username, CreateReviewRequest request) {
        User user = userService.getByUsername(username);
        AlbumResponse albumDto = catalogService.getOrCreateAlbum(request.spotifyId());
        Album album = catalogService.getAlbumEntityById(albumDto.id());

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
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));

        if (!review.getUser().getUsername().equalsIgnoreCase(username)) {
            throw new IllegalArgumentException("You can only edit your own reviews.");
        }

        review.setRating(request.rating());
        review.setReviewText(request.reviewText());

        Review updated = reviewRepository.save(review);
        return toResponse(updated);
    }

    @Transactional
    public void deleteReview(String username, UUID reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));

        if (!review.getUser().getUsername().equalsIgnoreCase(username)) {
            throw new IllegalArgumentException("You can only delete your own reviews.");
        }

        reviewRepository.delete(review);
    }

    @Transactional(readOnly = true)
    public AlbumReviewsSummaryResponse getReviewsByAlbum(String externalId) {
        List<Review> reviews = reviewRepository.findByAlbumExternalIdOrderByCreatedAtDesc(externalId);
        Double avg = reviewRepository.findAverageRatingByAlbumExternalId(externalId);
        long count = reviews.size();

        List<ReviewResponse> dtoList = reviews.stream().map(this::toResponse).toList();
        return new AlbumReviewsSummaryResponse(avg != null ? Math.round(avg * 10.0) / 10.0 : null, count, dtoList);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByUser(String username) {
        // Validate user existence
        userService.getByUsername(username);
        List<Review> reviews = reviewRepository.findByUserUsernameOrderByCreatedAtDesc(username);
        return reviews.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ReviewResponse getUserReviewForAlbum(String username, String externalId) {
        return reviewRepository.findByUserUsernameAndAlbumExternalId(username.toLowerCase(), externalId)
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public long countReviewsByUser(String username) {
        return reviewRepository.countByUserUsername(username.toLowerCase());
    }

    private ReviewResponse toResponse(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getUser().getUsername(),
                review.getAlbum().getExternalId(),
                review.getAlbum().getTitle(),
                review.getAlbum().getArtist(),
                review.getAlbum().getCoverUrl(),
                review.getAlbum().getReleaseYear(),
                review.getRating(),
                review.getReviewText(),
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }
}
