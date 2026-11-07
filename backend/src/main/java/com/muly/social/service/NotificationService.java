package com.muly.social.service;

import com.muly.auth.model.User;
import com.muly.common.exception.ResourceNotFoundException;
import com.muly.social.dto.NotificationResponse;
import com.muly.social.dto.NotificationSummaryResponse;
import com.muly.social.model.Notification;
import com.muly.social.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public void createNotification(User recipient, User actor, String type, String message, String targetUrl) {
        if (recipient == null || actor == null) {
            return;
        }
        if (recipient.getId() != null && recipient.getId().equals(actor.getId())) {
            return;
        }
        if (recipient.getUsername().equalsIgnoreCase(actor.getUsername())) {
            return;
        }

        Notification notification = Notification.builder()
                .recipient(recipient)
                .actor(actor)
                .type(type)
                .message(message)
                .targetUrl(targetUrl)
                .read(false)
                .build();

        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public NotificationSummaryResponse getMyNotifications(String username) {
        String normalized = username.trim().toLowerCase(Locale.ROOT);
        List<NotificationResponse> items = notificationRepository
                .findTop30ByRecipientUsernameOrderByCreatedAtDesc(normalized)
                .stream()
                .map(this::toResponse)
                .toList();

        long unreadCount = notificationRepository.countByRecipientUsernameAndReadFalse(normalized);
        return new NotificationSummaryResponse(unreadCount, items);
    }

    @Transactional
    public NotificationSummaryResponse markAllAsRead(String username) {
        String normalized = username.trim().toLowerCase(Locale.ROOT);
        notificationRepository.markAllAsReadByRecipientUsername(normalized);
        return getMyNotifications(normalized);
    }

    @Transactional
    public NotificationResponse markAsRead(String username, UUID notificationId) {
        String normalized = username.trim().toLowerCase(Locale.ROOT);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));

        if (!notification.getRecipient().getUsername().equalsIgnoreCase(normalized)) {
            throw new IllegalArgumentException("You can only mark your own notifications as read.");
        }

        notification.setRead(true);
        return toResponse(notificationRepository.save(notification));
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getActor().getUsername(),
                n.getActor().getDisplayName(),
                n.getActor().getAvatarUrl(),
                n.getType(),
                n.getMessage(),
                n.getTargetUrl(),
                n.isRead(),
                n.getCreatedAt()
        );
    }
}
