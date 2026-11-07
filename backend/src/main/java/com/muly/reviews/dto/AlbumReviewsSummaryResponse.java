package com.muly.reviews.dto;

import java.util.List;

public record AlbumReviewsSummaryResponse(
        Double averageRating,
        long totalReviews,
        List<ReviewResponse> reviews,
        List<ReviewResponse> trackReviews,
        List<ReviewResponse> friendsReviews
) {
}
