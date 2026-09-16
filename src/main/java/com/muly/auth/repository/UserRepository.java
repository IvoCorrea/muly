package com.muly.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.muly.auth.model.User;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    
    Optional<User> findByUsername(String username);

    boolean existsByEmail(String Email);

    boolean existsByUsername(String Username);
}
