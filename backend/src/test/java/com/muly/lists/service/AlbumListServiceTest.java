package com.muly.lists.service;

import com.muly.auth.model.User;
import com.muly.auth.repository.UserRepository;
import com.muly.auth.service.UserService;
import com.muly.catalog.model.Album;
import com.muly.catalog.repository.AlbumRepository;
import com.muly.catalog.service.CatalogService;
import com.muly.catalog.service.SpotifyService;
import com.muly.lists.dto.*;
import com.muly.lists.model.AlbumList;
import com.muly.lists.model.AlbumListComment;
import com.muly.lists.model.AlbumListItem;
import com.muly.lists.repository.AlbumListCommentRepository;
import com.muly.lists.repository.AlbumListItemRepository;
import com.muly.lists.repository.AlbumListLikeRepository;
import com.muly.lists.repository.AlbumListRepository;
import com.muly.reviews.model.Review;
import com.muly.reviews.repository.ReviewRepository;
import com.muly.reviews.repository.TrackReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class AlbumListServiceTest {

    private User user;
    private Album album1;
    private Album album2;
    private UUID listId;
    private AlbumList albumList;
    private AlbumListService albumListService;

    @SuppressWarnings("unchecked")
    private static <T> T stubInterface(Class<T> iface, java.lang.reflect.InvocationHandler handler) {
        return (T) Proxy.newProxyInstance(iface.getClassLoader(), new Class<?>[]{iface}, handler);
    }

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(UUID.randomUUID())
                .username("ivo")
                .email("ivo@muly.com")
                .passwordHash("hash")
                .createdAt(Instant.now())
                .build();

        album1 = Album.builder()
                .id(UUID.randomUUID())
                .externalId("spotify-1")
                .title("In Rainbows")
                .artist("Radiohead")
                .releaseYear(2007)
                .coverUrl("https://cover1")
                .build();

        album2 = Album.builder()
                .id(UUID.randomUUID())
                .externalId("spotify-2")
                .title("OK Computer")
                .artist("Radiohead")
                .releaseYear(1997)
                .coverUrl("https://cover2")
                .build();

        listId = UUID.randomUUID();
        albumList = AlbumList.builder()
                .id(listId)
                .user(user)
                .title("Pink & Classic Albums")
                .description("My favorite records")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        AlbumListRepository listRepository = stubInterface(AlbumListRepository.class, (proxy, method, args) -> {
            if ("save".equals(method.getName())) return albumList;
            if ("findById".equals(method.getName())) return Optional.of(albumList);
            return List.of(albumList);
        });

        List<AlbumListItem> savedItems = List.of(
                AlbumListItem.builder().albumList(albumList).album(album1).position(1).build(),
                AlbumListItem.builder().albumList(albumList).album(album2).position(2).build()
        );

        AlbumListItemRepository itemRepository = stubInterface(AlbumListItemRepository.class, (proxy, method, args) -> {
            if ("findByAlbumListIdOrderByPositionAsc".equals(method.getName())) return savedItems;
            if ("save".equals(method.getName())) return args[0];
            return null;
        });

        AlbumListLikeRepository likeRepository = stubInterface(AlbumListLikeRepository.class, (proxy, method, args) -> {
            if ("countByAlbumListId".equals(method.getName())) return 5L;
            if ("existsByAlbumListIdAndUserUsername".equals(method.getName())) return true;
            return Optional.empty();
        });

        AlbumListCommentRepository commentRepository = stubInterface(AlbumListCommentRepository.class, (proxy, method, args) -> {
            if ("findByAlbumListIdOrderByCreatedAtAsc".equals(method.getName())) return List.of();
            if ("countByAlbumListId".equals(method.getName())) return 0L;
            if ("save".equals(method.getName())) {
                AlbumListComment c = (AlbumListComment) args[0];
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            }
            return null;
        });

        UserRepository userRepository = stubInterface(UserRepository.class, (proxy, method, args) -> Optional.of(user));
        UserService userService = new UserService(userRepository);

        AlbumRepository albumRepository = stubInterface(AlbumRepository.class, (proxy, method, args) -> {
            if ("findByExternalId".equals(method.getName())) {
                return "spotify-1".equals(args[0]) ? Optional.of(album1) : Optional.of(album2);
            }
            if ("findById".equals(method.getName())) {
                return album1.getId().equals(args[0]) ? Optional.of(album1) : Optional.of(album2);
            }
            return Optional.empty();
        });

        SpotifyService spotifyService = new SpotifyService("", "");
        CatalogService catalogService = new CatalogService(albumRepository, spotifyService);

        Review rev1 = Review.builder().user(user).album(album1).rating(5.0).build();
        ReviewRepository reviewRepository = stubInterface(ReviewRepository.class, (proxy, method, args) -> {
            if ("findByUserUsernameOrderByCreatedAtDesc".equals(method.getName())) return List.of(rev1);
            return List.of();
        });

        TrackReviewRepository trackReviewRepository = stubInterface(TrackReviewRepository.class, (proxy, method, args) -> List.of());

        albumListService = new AlbumListService(
                listRepository,
                itemRepository,
                likeRepository,
                commentRepository,
                userService,
                catalogService,
                reviewRepository,
                trackReviewRepository
        );
    }

    @Test
    void shouldCreateListAndCalculateReviewedPercentage() {
        CreateAlbumListRequest req = new CreateAlbumListRequest(
                "Pink & Classic Albums",
                "My favorite records",
                List.of("spotify-1", "spotify-2")
        );

        AlbumListDetailResponse detail = albumListService.createList("ivo", req);

        assertEquals("Pink & Classic Albums", detail.title());
        assertEquals(2, detail.items().size());
        assertEquals(50, detail.reviewedPercentage());
        assertTrue(detail.likedByMe());
        assertEquals(5L, detail.likesCount());
        assertTrue(detail.items().get(0).reviewedByMe());
        assertFalse(detail.items().get(1).reviewedByMe());
    }

    @Test
    void shouldAddCommentToList() {
        AlbumListCommentResponse res = albumListService.addComment("ivo", listId, new CreateListCommentRequest("Awesome list!"));
        assertEquals("ivo", res.username());
        assertEquals("Awesome list!", res.content());
        assertNotNull(res.id());
    }

    @Test
    void shouldBuildSpotifyTrackSearchUrl() {
        SpotifyService spotifyService = new SpotifyService("", "");
        String url = spotifyService.buildSpotifyTrackSearchUrl("Creep", "Radiohead");
        assertEquals("https://open.spotify.com/search/Creep%20Radiohead", url);
    }
}
