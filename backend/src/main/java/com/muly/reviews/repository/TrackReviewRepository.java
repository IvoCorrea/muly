package com.muly.reviews.repository;

import com.muly.reviews.model.TrackReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TrackReviewRepository extends JpaRepository<TrackReview, UUID> {

    List<TrackReview> findByAlbumExternalIdOrderByCreatedAtDesc(String externalId);

    List<TrackReview> findByUserUsernameOrderByCreatedAtDesc(String username);

    List<TrackReview> findByUserUsernameAndAlbumExternalIdOrderByTrackNumberAsc(String username, String externalId);

    Optional<TrackReview> findByUserUsernameAndAlbumExternalIdAndTrackNumber(String username, String externalId, Integer trackNumber);

    long countByUserUsername(String username);
}
