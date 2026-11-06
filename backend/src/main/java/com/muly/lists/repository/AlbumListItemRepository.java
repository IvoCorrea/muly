package com.muly.lists.repository;

import com.muly.lists.model.AlbumListItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AlbumListItemRepository extends JpaRepository<AlbumListItem, UUID> {

    List<AlbumListItem> findByAlbumListIdOrderByPositionAsc(UUID listId);

    void deleteByAlbumListId(UUID listId);
}
