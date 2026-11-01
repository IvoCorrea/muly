package com.muly.reviews.repository;

import com.muly.reviews.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {

    List<Review> findByAlbumExternalIdOrderByCreatedAtDesc(String externalId);

    List<Review> findByUserUsernameOrderByCreatedAtDesc(String username);

    Optional<Review> findByUserUsernameAndAlbumExternalId(String username, String externalId);

    Optional<Review> findByUserIdAndAlbumId(UUID userId, UUID albumId);

    long countByUserUsername(String username);

    long countByAlbumExternalId(String externalId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.album.externalId = :externalId")
    Double findAverageRatingByAlbumExternalId(@Param("externalId") String externalId);
}
