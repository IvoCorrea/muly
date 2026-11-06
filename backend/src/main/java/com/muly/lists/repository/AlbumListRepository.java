package com.muly.lists.repository;

import com.muly.lists.model.AlbumList;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AlbumListRepository extends JpaRepository<AlbumList, UUID> {

    List<AlbumList> findByUserUsernameOrderByCreatedAtDesc(String username);

    List<AlbumList> findAllByOrderByCreatedAtDesc();

    List<AlbumList> findByTitleContainingIgnoreCaseOrderByCreatedAtDesc(String query);
}
