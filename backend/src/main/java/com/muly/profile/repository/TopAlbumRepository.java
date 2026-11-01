package com.muly.profile.repository;

import com.muly.profile.model.TopAlbum;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TopAlbumRepository extends JpaRepository<TopAlbum, UUID> {

    List<TopAlbum> findByUserUsernameOrderByPositionAsc(String username);

    void deleteByUserUsername(String username);
}
