package com.muly.lists.service;

import com.muly.auth.model.User;
import com.muly.auth.service.UserService;
import com.muly.catalog.dto.AlbumResponse;
import com.muly.catalog.model.Album;
import com.muly.catalog.service.CatalogService;
import com.muly.common.exception.ResourceNotFoundException;
import com.muly.lists.dto.*;
import com.muly.lists.model.AlbumList;
import com.muly.lists.model.AlbumListComment;
import com.muly.lists.model.AlbumListItem;
import com.muly.lists.model.AlbumListLike;
import com.muly.lists.repository.AlbumListCommentRepository;
import com.muly.lists.repository.AlbumListItemRepository;
import com.muly.lists.repository.AlbumListLikeRepository;
import com.muly.lists.repository.AlbumListRepository;
import com.muly.reviews.repository.ReviewRepository;
import com.muly.reviews.repository.TrackReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class AlbumListService {

    private final AlbumListRepository listRepository;
    private final AlbumListItemRepository itemRepository;
    private final AlbumListLikeRepository likeRepository;
    private final AlbumListCommentRepository commentRepository;
    private final UserService userService;
    private final CatalogService catalogService;
    private final ReviewRepository reviewRepository;
    private final TrackReviewRepository trackReviewRepository;

    public AlbumListService(
            AlbumListRepository listRepository,
            AlbumListItemRepository itemRepository,
            AlbumListLikeRepository likeRepository,
            AlbumListCommentRepository commentRepository,
            UserService userService,
            CatalogService catalogService,
            ReviewRepository reviewRepository,
            TrackReviewRepository trackReviewRepository
    ) {
        this.listRepository = listRepository;
        this.itemRepository = itemRepository;
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
        this.userService = userService;
        this.catalogService = catalogService;
        this.reviewRepository = reviewRepository;
        this.trackReviewRepository = trackReviewRepository;
    }

    @Transactional(readOnly = true)
    public List<AlbumListSummaryResponse> getAllLists(String query) {
        List<AlbumList> lists;
        if (query != null && !query.isBlank()) {
            lists = listRepository.findByTitleContainingIgnoreCaseOrderByCreatedAtDesc(query.trim());
        } else {
            lists = listRepository.findAllByOrderByCreatedAtDesc();
        }
        return lists.stream().map(this::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public List<AlbumListSummaryResponse> getListsByUser(String username) {
        String normalized = username.trim().toLowerCase(Locale.ROOT);
        userService.getByUsername(normalized);
        return listRepository.findByUserUsernameOrderByCreatedAtDesc(normalized)
                .stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public AlbumListDetailResponse getListDetail(UUID listId, String viewerUsername) {
        AlbumList albumList = listRepository.findById(listId)
                .orElseThrow(() -> new ResourceNotFoundException("Album list not found with id: " + listId));

        List<AlbumListItem> items = itemRepository.findByAlbumListIdOrderByPositionAsc(listId);
        List<AlbumListComment> comments = commentRepository.findByAlbumListIdOrderByCreatedAtAsc(listId);
        long likesCount = likeRepository.countByAlbumListId(listId);

        boolean likedByMe = false;
        Set<String> reviewedAlbumIds = new HashSet<>();

        if (viewerUsername != null && !viewerUsername.isBlank()) {
            String normViewer = viewerUsername.trim().toLowerCase(Locale.ROOT);
            likedByMe = likeRepository.existsByAlbumListIdAndUserUsername(listId, normViewer);

            reviewRepository.findByUserUsernameOrderByCreatedAtDesc(normViewer)
                    .forEach(r -> reviewedAlbumIds.add(r.getAlbum().getExternalId()));
            trackReviewRepository.findByUserUsernameOrderByCreatedAtDesc(normViewer)
                    .forEach(tr -> reviewedAlbumIds.add(tr.getAlbum().getExternalId()));
        }

        int reviewedCount = 0;
        List<AlbumListItemResponse> itemDtos = new ArrayList<>(items.size());
        for (AlbumListItem item : items) {
            boolean reviewed = reviewedAlbumIds.contains(item.getAlbum().getExternalId());
            if (reviewed) {
                reviewedCount++;
            }
            itemDtos.add(new AlbumListItemResponse(
                    item.getPosition(),
                    catalogService.toResponse(item.getAlbum()),
                    reviewed
            ));
        }

        int reviewedPercentage = items.isEmpty() ? 0 : Math.round((reviewedCount * 100.0f) / items.size());

        List<AlbumListCommentResponse> commentDtos = comments.stream()
                .map(c -> new AlbumListCommentResponse(
                        c.getId(),
                        c.getUser().getUsername(),
                        c.getUser().getDisplayName(),
                        c.getUser().getAvatarUrl(),
                        c.getContent(),
                        c.getCreatedAt()
                ))
                .toList();

        return new AlbumListDetailResponse(
                albumList.getId(),
                albumList.getTitle(),
                albumList.getDescription(),
                albumList.getUser().getUsername(),
                albumList.getUser().getDisplayName(),
                albumList.getUser().getAvatarUrl(),
                albumList.getCreatedAt(),
                albumList.getUpdatedAt(),
                likesCount,
                likedByMe,
                reviewedPercentage,
                itemDtos,
                commentDtos
        );
    }

    @Transactional
    public AlbumListDetailResponse createList(String username, CreateAlbumListRequest request) {
        User user = userService.getByUsername(username);

        AlbumList albumList = AlbumList.builder()
                .user(user)
                .title(request.title().trim())
                .description(request.description() != null && !request.description().isBlank() ? request.description().trim() : null)
                .build();

        AlbumList saved = listRepository.save(albumList);
        saveItems(saved, request.spotifyIds());
        return getListDetail(saved.getId(), username);
    }

    @Transactional
    public AlbumListDetailResponse updateList(String username, UUID listId, UpdateAlbumListRequest request) {
        AlbumList albumList = listRepository.findById(listId)
                .orElseThrow(() -> new ResourceNotFoundException("Album list not found with id: " + listId));

        if (!albumList.getUser().getUsername().equalsIgnoreCase(username)) {
            throw new IllegalArgumentException("You can only edit your own lists.");
        }

        albumList.setTitle(request.title().trim());
        albumList.setDescription(request.description() != null && !request.description().isBlank() ? request.description().trim() : null);
        listRepository.save(albumList);

        itemRepository.deleteByAlbumListId(listId);
        itemRepository.flush();
        saveItems(albumList, request.spotifyIds());

        return getListDetail(listId, username);
    }

    @Transactional
    public void deleteList(String username, UUID listId) {
        AlbumList albumList = listRepository.findById(listId)
                .orElseThrow(() -> new ResourceNotFoundException("Album list not found with id: " + listId));

        if (!albumList.getUser().getUsername().equalsIgnoreCase(username)) {
            throw new IllegalArgumentException("You can only delete your own lists.");
        }

        commentRepository.deleteByAlbumListId(listId);
        likeRepository.deleteByAlbumListId(listId);
        itemRepository.deleteByAlbumListId(listId);
        listRepository.delete(albumList);
    }

    @Transactional
    public AlbumListDetailResponse toggleLike(String username, UUID listId) {
        AlbumList albumList = listRepository.findById(listId)
                .orElseThrow(() -> new ResourceNotFoundException("Album list not found with id: " + listId));

        User user = userService.getByUsername(username);
        Optional<AlbumListLike> existing = likeRepository.findByAlbumListIdAndUserUsername(listId, user.getUsername());

        if (existing.isPresent()) {
            likeRepository.delete(existing.get());
        } else {
            AlbumListLike like = AlbumListLike.builder()
                    .albumList(albumList)
                    .user(user)
                    .build();
            likeRepository.save(like);
        }
        likeRepository.flush();

        return getListDetail(listId, username);
    }

    @Transactional
    public AlbumListCommentResponse addComment(String username, UUID listId, CreateListCommentRequest request) {
        AlbumList albumList = listRepository.findById(listId)
                .orElseThrow(() -> new ResourceNotFoundException("Album list not found with id: " + listId));

        User user = userService.getByUsername(username);
        AlbumListComment comment = AlbumListComment.builder()
                .albumList(albumList)
                .user(user)
                .content(request.content().trim())
                .build();

        AlbumListComment saved = commentRepository.save(comment);
        return new AlbumListCommentResponse(
                saved.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getAvatarUrl(),
                saved.getContent(),
                saved.getCreatedAt()
        );
    }

    @Transactional
    public void deleteComment(String username, UUID listId, UUID commentId) {
        AlbumListComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));

        if (!comment.getAlbumList().getId().equals(listId)) {
            throw new IllegalArgumentException("Comment does not belong to this list.");
        }

        boolean isCommentAuthor = comment.getUser().getUsername().equalsIgnoreCase(username);
        boolean isListOwner = comment.getAlbumList().getUser().getUsername().equalsIgnoreCase(username);

        if (!isCommentAuthor && !isListOwner) {
            throw new IllegalArgumentException("You do not have permission to delete this comment.");
        }

        commentRepository.delete(comment);
    }

    private void saveItems(AlbumList albumList, List<String> spotifyIds) {
        if (spotifyIds == null || spotifyIds.isEmpty()) {
            return;
        }

        Set<String> seen = new LinkedHashSet<>();
        for (String id : spotifyIds) {
            if (id != null && !id.isBlank()) {
                seen.add(id.trim());
            }
        }

        int pos = 1;
        for (String externalId : seen) {
            AlbumResponse dto = catalogService.getOrCreateAlbum(externalId);
            Album album = catalogService.getAlbumEntityById(dto.id());
            AlbumListItem item = AlbumListItem.builder()
                    .albumList(albumList)
                    .album(album)
                    .position(pos++)
                    .build();
            itemRepository.save(item);
        }
        itemRepository.flush();
    }

    private AlbumListSummaryResponse toSummary(AlbumList albumList) {
        List<AlbumListItem> items = itemRepository.findByAlbumListIdOrderByPositionAsc(albumList.getId());
        long likesCount = likeRepository.countByAlbumListId(albumList.getId());
        long commentsCount = commentRepository.countByAlbumListId(albumList.getId());

        List<String> previewCovers = items.stream()
                .map(i -> i.getAlbum().getCoverUrl())
                .filter(Objects::nonNull)
                .limit(4)
                .toList();

        return new AlbumListSummaryResponse(
                albumList.getId(),
                albumList.getTitle(),
                albumList.getDescription(),
                albumList.getUser().getUsername(),
                albumList.getUser().getDisplayName(),
                albumList.getUser().getAvatarUrl(),
                items.size(),
                likesCount,
                commentsCount,
                previewCovers,
                albumList.getCreatedAt()
        );
    }
}
