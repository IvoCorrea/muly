package com.muly.social.repository;

import com.muly.social.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findTop30ByRecipientUsernameOrderByCreatedAtDesc(String username);

    long countByRecipientUsernameAndReadFalse(String username);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipient.username = :username AND n.read = false")
    void markAllAsReadByRecipientUsername(@Param("username") String username);
}
