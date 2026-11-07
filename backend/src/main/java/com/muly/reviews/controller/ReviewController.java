package com.muly.reviews.controller;

import com.muly.reviews.dto.*;
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

    @PostMapping("/{id}/like")
    public ResponseEntity<ReviewResponse> toggleLike(
            @PathVariable UUID id,
            Principal principal
    ) {
        return ResponseEntity.ok(reviewService.toggleLike(principal.getName(), id));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<ReviewCommentResponse> addComment(
            @PathVariable UUID id,
            @Valid @RequestBody CreateReviewCommentRequest request,
            Principal principal
    ) {
        ReviewCommentResponse comment = reviewService.addComment(principal.getName(), id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @DeleteMapping("/{id}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable UUID id,
            @PathVariable UUID commentId,
            Principal principal
    ) {
        reviewService.deleteComment(principal.getName(), id, commentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/feed")
    public ResponseEntity<List<ReviewResponse>> getFeed(
            @RequestParam(value = "tab", defaultValue = "trending") String tab,
            Principal principal
    ) {
        String viewer = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(reviewService.getFeed(tab, viewer));
    }

    @GetMapping("/album/{externalId}")
    public ResponseEntity<AlbumReviewsSummaryResponse> getReviewsByAlbum(
            @PathVariable String externalId,
            Principal principal
    ) {
        String viewer = principal != null ? principal.getName() : null;
        AlbumReviewsSummaryResponse response = reviewService.getReviewsByAlbum(externalId, viewer);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<List<ReviewResponse>> getReviewsByUser(
            @PathVariable String username,
            Principal principal
    ) {
        String viewer = principal != null ? principal.getName() : null;
        List<ReviewResponse> response = reviewService.getReviewsByUser(username, viewer);
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
