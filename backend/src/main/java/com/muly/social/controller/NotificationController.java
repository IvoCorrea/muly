package com.muly.social.controller;

import com.muly.social.dto.NotificationResponse;
import com.muly.social.dto.NotificationSummaryResponse;
import com.muly.social.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<NotificationSummaryResponse> getMyNotifications(Principal principal) {
        return ResponseEntity.ok(notificationService.getMyNotifications(principal.getName()));
    }

    @PutMapping("/read-all")
    public ResponseEntity<NotificationSummaryResponse> markAllAsRead(Principal principal) {
        return ResponseEntity.ok(notificationService.markAllAsRead(principal.getName()));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable UUID id,
            Principal principal
    ) {
        return ResponseEntity.ok(notificationService.markAsRead(principal.getName(), id));
    }
}
