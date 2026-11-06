package com.muly.lists.repository;

import com.muly.lists.model.AlbumListComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AlbumListCommentRepository extends JpaRepository<AlbumListComment, UUID> {

    List<AlbumListComment> findByAlbumListIdOrderByCreatedAtAsc(UUID listId);

    long countByAlbumListId(UUID listId);

    void deleteByAlbumListId(UUID listId);
}
