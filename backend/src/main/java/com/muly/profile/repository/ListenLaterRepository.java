package com.muly.profile.repository;

import com.muly.profile.model.ListenLaterItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ListenLaterRepository extends JpaRepository<ListenLaterItem, UUID> {

    List<ListenLaterItem> findByUserUsernameOrderByCreatedAtDesc(String username);

    Optional<ListenLaterItem> findByUserUsernameAndAlbumExternalId(String username, String externalId);

    boolean existsByUserUsernameAndAlbumExternalId(String username, String externalId);

    long countByUserUsername(String username);
}
