package com.muly.lists.controller;

import com.muly.lists.dto.*;
import com.muly.lists.service.AlbumListService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/lists")
public class AlbumListController {

    private final AlbumListService listService;

    public AlbumListController(AlbumListService listService) {
        this.listService = listService;
    }

    @GetMapping
    public ResponseEntity<List<AlbumListSummaryResponse>> getAllLists(
            @RequestParam(value = "q", defaultValue = "") String query
    ) {
        return ResponseEntity.ok(listService.getAllLists(query));
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<List<AlbumListSummaryResponse>> getListsByUser(@PathVariable String username) {
        return ResponseEntity.ok(listService.getListsByUser(username));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlbumListDetailResponse> getListDetail(
            @PathVariable UUID id,
            Principal principal
    ) {
        String viewer = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(listService.getListDetail(id, viewer));
    }

    @PostMapping
    public ResponseEntity<AlbumListDetailResponse> createList(
            @Valid @RequestBody CreateAlbumListRequest request,
            Principal principal
    ) {
        AlbumListDetailResponse created = listService.createList(principal.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AlbumListDetailResponse> updateList(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAlbumListRequest request,
            Principal principal
    ) {
        return ResponseEntity.ok(listService.updateList(principal.getName(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteList(
            @PathVariable UUID id,
            Principal principal
    ) {
        listService.deleteList(principal.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<AlbumListDetailResponse> toggleLike(
            @PathVariable UUID id,
            Principal principal
    ) {
        return ResponseEntity.ok(listService.toggleLike(principal.getName(), id));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<AlbumListCommentResponse> addComment(
            @PathVariable UUID id,
            @Valid @RequestBody CreateListCommentRequest request,
            Principal principal
    ) {
        AlbumListCommentResponse comment = listService.addComment(principal.getName(), id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @DeleteMapping("/{id}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable UUID id,
            @PathVariable UUID commentId,
            Principal principal
    ) {
        listService.deleteComment(principal.getName(), id, commentId);
        return ResponseEntity.noContent().build();
    }
}
