package com.muly.lists.repository;

import com.muly.lists.model.AlbumListLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AlbumListLikeRepository extends JpaRepository<AlbumListLike, UUID> {

    long countByAlbumListId(UUID listId);

    Optional<AlbumListLike> findByAlbumListIdAndUserUsername(UUID listId, String username);

    boolean existsByAlbumListIdAndUserUsername(UUID listId, String username);

    void deleteByAlbumListId(UUID listId);
}
