package com.muly.catalog.repository;

import com.muly.catalog.model.Album;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AlbumRepository extends JpaRepository<Album, UUID> {
    Optional<Album> findByExternalId(String externalId);
}
