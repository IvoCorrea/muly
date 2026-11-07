package com.muly.reviews.repository;

import com.muly.reviews.model.ReviewLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ReviewLikeRepository extends JpaRepository<ReviewLike, UUID> {

    long countByReviewId(UUID reviewId);

    boolean existsByReviewIdAndUserUsername(UUID reviewId, String username);

    Optional<ReviewLike> findByReviewIdAndUserUsername(UUID reviewId, String username);

    void deleteByReviewId(UUID reviewId);
}
