package com.muly.reviews.controller;

import com.muly.reviews.dto.AlbumReviewsSummaryResponse;
import com.muly.reviews.dto.CreateReviewRequest;
import com.muly.reviews.dto.ReviewResponse;
import com.muly.reviews.dto.UpdateReviewRequest;
import com.muly.reviews.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    public ResponseEntity<ReviewResponse> createOrUpdateReview(
            @Valid @RequestBody CreateReviewRequest request,
            Principal principal
    ) {
        ReviewResponse response = reviewService.createOrUpdateReview(principal.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReviewResponse> updateReview(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateReviewRequest request,
            Principal principal
    ) {
        ReviewResponse response = reviewService.updateReview(principal.getName(), id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable UUID id,
            Principal principal
    ) {
        reviewService.deleteReview(principal.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/album/{externalId}")
    public ResponseEntity<AlbumReviewsSummaryResponse> getReviewsByAlbum(@PathVariable String externalId) {
        AlbumReviewsSummaryResponse response = reviewService.getReviewsByAlbum(externalId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<List<ReviewResponse>> getReviewsByUser(@PathVariable String username) {
        List<ReviewResponse> response = reviewService.getReviewsByUser(username);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me/album/{externalId}")
    public ResponseEntity<ReviewResponse> getMyReviewForAlbum(
            @PathVariable String externalId,
            Principal principal
    ) {
        ReviewResponse response = reviewService.getUserReviewForAlbum(principal.getName(), externalId);
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me/album/{externalId}/tracks")
    public ResponseEntity<List<ReviewResponse>> getMyTrackReviewsForAlbum(
            @PathVariable String externalId,
            Principal principal
    ) {
        List<ReviewResponse> response = reviewService.getUserTrackReviewsForAlbum(principal.getName(), externalId);
        return ResponseEntity.ok(response);
    }
}
