package com.muly.profile.repository;

import com.muly.profile.model.UserFollow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserFollowRepository extends JpaRepository<UserFollow, UUID> {

    long countByFollowingUsername(String username);

    long countByFollowerUsername(String username);

    boolean existsByFollowerUsernameAndFollowingUsername(String followerUsername, String followingUsername);

    Optional<UserFollow> findByFollowerUsernameAndFollowingUsername(String followerUsername, String followingUsername);

    List<UserFollow> findByFollowingUsernameOrderByCreatedAtDesc(String username);

    List<UserFollow> findByFollowerUsernameOrderByCreatedAtDesc(String username);
}
