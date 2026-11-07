package com.muly.reviews.repository;

import com.muly.reviews.model.ReviewComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ReviewCommentRepository extends JpaRepository<ReviewComment, UUID> {

    List<ReviewComment> findByReviewIdOrderByCreatedAtAsc(UUID reviewId);

    long countByReviewId(UUID reviewId);

    void deleteByReviewId(UUID reviewId);
}
