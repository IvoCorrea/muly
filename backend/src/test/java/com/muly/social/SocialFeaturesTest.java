package com.muly.social;

import com.muly.auth.model.User;
import com.muly.auth.repository.UserRepository;
import com.muly.auth.service.UserService;
import com.muly.catalog.dto.AlbumResponse;
import com.muly.catalog.dto.ArtistDetailResponse;
import com.muly.catalog.dto.RankedAlbumResponse;
import com.muly.catalog.model.Album;
import com.muly.catalog.repository.AlbumRepository;
import com.muly.catalog.service.CatalogService;
import com.muly.catalog.service.SpotifyService;
import com.muly.profile.dto.UserProfileResponse;
import com.muly.profile.model.ListenLaterItem;
import com.muly.profile.model.UserFollow;
import com.muly.profile.repository.ListenLaterRepository;
import com.muly.profile.repository.TopAlbumRepository;
import com.muly.profile.repository.UserFollowRepository;
import com.muly.profile.service.ImageKitService;
import com.muly.profile.service.ProfileService;
import com.muly.reviews.dto.CreateReviewCommentRequest;
import com.muly.reviews.dto.CreateReviewRequest;
import com.muly.reviews.dto.ReviewCommentResponse;
import com.muly.reviews.dto.ReviewResponse;
import com.muly.reviews.model.Review;
import com.muly.reviews.model.ReviewComment;
import com.muly.reviews.model.TrackReview;
import com.muly.reviews.repository.ReviewCommentRepository;
import com.muly.reviews.repository.ReviewLikeRepository;
import com.muly.reviews.repository.ReviewRepository;
import com.muly.reviews.repository.TrackReviewRepository;
import com.muly.reviews.service.ReviewService;
import com.muly.social.model.Notification;
import com.muly.social.repository.NotificationRepository;
import com.muly.social.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class SocialFeaturesTest {

    private User userIvo;
    private User userAna;
    private Album album1;
    private Album album2;
    private List<Notification> savedNotifications;
    private List<ListenLaterItem> listenLaterStore;
    private ReviewService reviewService;
    private ProfileService profileService;

    @SuppressWarnings("unchecked")
    private static <T> T stubInterface(Class<T> iface, java.lang.reflect.InvocationHandler handler) {
        return (T) Proxy.newProxyInstance(iface.getClassLoader(), new Class<?>[]{iface}, handler);
    }

    @BeforeEach
    void setUp() {
        userIvo = User.builder()
                .id(UUID.randomUUID())
                .username("ivo")
                .email("ivo@muly.com")
                .passwordHash("hash")
                .createdAt(Instant.now())
                .build();

        userAna = User.builder()
                .id(UUID.randomUUID())
                .username("ana")
                .email("ana@muly.com")
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
                .title("Kid A")
                .artist("Radiohead")
                .releaseYear(2000)
                .coverUrl("https://cover2")
                .build();

        savedNotifications = new ArrayList<>();

        NotificationRepository notificationRepository = stubInterface(NotificationRepository.class, (proxy, method, args) -> {
            if ("save".equals(method.getName())) {
                Notification n = (Notification) args[0];
                n.setId(UUID.randomUUID());
                n.setCreatedAt(Instant.now());
                savedNotifications.add(n);
                return n;
            }
            if ("findTop30ByRecipientUsernameOrderByCreatedAtDesc".equals(method.getName())) {
                return savedNotifications;
            }
            if ("countByRecipientUsernameAndReadFalse".equals(method.getName())) {
                return (long) savedNotifications.size();
            }
            return null;
        });

        NotificationService notificationService = new NotificationService(notificationRepository);

        UserRepository userRepository = stubInterface(UserRepository.class, (proxy, method, args) -> {
            if ("findByUsername".equals(method.getName())) {
                String u = (String) args[0];
                return "ivo".equalsIgnoreCase(u) ? Optional.of(userIvo) : Optional.of(userAna);
            }
            return Optional.of(userIvo);
        });
        UserService userService = new UserService(userRepository);

        AlbumRepository albumRepository = stubInterface(AlbumRepository.class, (proxy, method, args) -> {
            String m = method.getName();
            if ("findByArtistContainingIgnoreCaseOrderByReleaseYearDesc".equals(m)) {
                return List.of(album1);
            }
            if ("findByExternalId".equals(m) && args != null && args.length > 0) {
                return "spotify-2".equals(args[0]) ? Optional.of(album2) : Optional.of(album1);
            }
            if ("findById".equals(m) && args != null && args.length > 0) {
                return album2.getId().equals(args[0]) ? Optional.of(album2) : Optional.of(album1);
            }
            return Optional.of(album1);
        });
        SpotifyService spotifyService = new SpotifyService("", "");
        CatalogService catalogService = new CatalogService(albumRepository, spotifyService);

        Review reviewIvo = Review.builder()
                .id(UUID.randomUUID())
                .user(userIvo)
                .album(album1)
                .rating(4.5)
                .reviewText("Obra-prima!")
                .createdAt(Instant.now())
                .build();

        Review reviewAna = Review.builder()
                .id(UUID.randomUUID())
                .user(userAna)
                .album(album1)
                .rating(4.0)
                .reviewText("Muito bom!")
                .createdAt(Instant.now())
                .build();

        List<Review> dynamicReviews = new ArrayList<>();
        ReviewRepository reviewRepository = stubInterface(ReviewRepository.class, (proxy, method, args) -> {
            String m = method.getName();
            if ("findById".equals(m)) return Optional.of(reviewIvo);
            if ("findAll".equals(m)) return List.of(reviewIvo, reviewAna);
            if ("save".equals(m)) {
                Review r = (Review) args[0];
                if (r.getId() == null) r.setId(UUID.randomUUID());
                if (r.getCreatedAt() == null) r.setCreatedAt(Instant.now());
                dynamicReviews.add(r);
                return r;
            }
            if ("findByUserUsernameOrderByCreatedAtDesc".equals(m)) {
                String u = (String) args[0];
                List<Review> result = new ArrayList<>();
                result.add("ivo".equalsIgnoreCase(u) ? reviewIvo : reviewAna);
                for (Review r : dynamicReviews) {
                    if (r.getUser().getUsername().equalsIgnoreCase(u)) {
                        result.add(r);
                    }
                }
                return result;
            }
            if ("findByAlbumExternalIdOrderByCreatedAtDesc".equals(m)) {
                return List.of(reviewIvo, reviewAna);
            }
            if ("countByUserUsername".equals(m)) return 1L;
            return Optional.empty();
        });

        List<TrackReview> savedTrackReviews = new ArrayList<>();
        TrackReviewRepository trackReviewRepository = stubInterface(TrackReviewRepository.class, (proxy, method, args) -> {
            String m = method.getName();
            if ("countByUserUsername".equals(m)) return (long) savedTrackReviews.size();
            if ("findByUserUsernameAndAlbumExternalIdAndTrackNumber".equals(m)) return Optional.empty();
            if ("findByUserUsernameOrderByCreatedAtDesc".equals(m)) {
                String u = (String) args[0];
                return savedTrackReviews.stream()
                        .filter(tr -> tr.getUser().getUsername().equalsIgnoreCase(u))
                        .toList();
            }
            if ("save".equals(m)) {
                TrackReview tr = (TrackReview) args[0];
                if (tr.getId() == null) tr.setId(UUID.randomUUID());
                if (tr.getCreatedAt() == null) tr.setCreatedAt(Instant.now());
                savedTrackReviews.add(tr);
                return tr;
            }
            return List.of();
        });

        ReviewLikeRepository reviewLikeRepository = stubInterface(ReviewLikeRepository.class, (proxy, method, args) -> {
            if ("countByReviewId".equals(method.getName())) return 1L;
            if ("existsByReviewIdAndUserUsername".equals(method.getName())) return true;
            if ("findByReviewIdAndUserUsername".equals(method.getName())) return Optional.empty();
            return null;
        });

        ReviewCommentRepository reviewCommentRepository = stubInterface(ReviewCommentRepository.class, (proxy, method, args) -> {
            if ("findByReviewIdOrderByCreatedAtAsc".equals(method.getName())) return List.of();
            if ("save".equals(method.getName())) {
                ReviewComment c = (ReviewComment) args[0];
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            }
            return 0L;
        });

        UserFollow follow = UserFollow.builder().follower(userAna).following(userIvo).build();
        UserFollowRepository userFollowRepository = stubInterface(UserFollowRepository.class, (proxy, method, args) -> {
            String m = method.getName();
            if ("countByFollowingUsername".equals(m)) return 1L;
            if ("countByFollowerUsername".equals(m)) return 1L;
            if ("existsByFollowerUsernameAndFollowingUsername".equals(m)) return true;
            if ("findByFollowerUsernameAndFollowingUsername".equals(m)) return Optional.empty();
            if ("findByFollowerUsernameOrderByCreatedAtDesc".equals(m)) return List.of(follow);
            return List.of();
        });

        listenLaterStore = new ArrayList<>();
        ListenLaterRepository listenLaterRepository = stubInterface(ListenLaterRepository.class, (proxy, method, args) -> {
            String m = method.getName();
            if ("findByUserUsernameOrderByCreatedAtDesc".equals(m)) {
                String u = (String) args[0];
                return listenLaterStore.stream()
                        .filter(item -> item.getUser().getUsername().equalsIgnoreCase(u))
                        .toList();
            }
            if ("findByUserUsernameAndAlbumExternalId".equals(m)) {
                String u = (String) args[0];
                String ext = (String) args[1];
                return listenLaterStore.stream()
                        .filter(item -> item.getUser().getUsername().equalsIgnoreCase(u)
                                && item.getAlbum().getExternalId().equals(ext))
                        .findFirst();
            }
            if ("existsByUserUsernameAndAlbumExternalId".equals(m)) {
                String u = (String) args[0];
                String ext = (String) args[1];
                return listenLaterStore.stream()
                        .anyMatch(item -> item.getUser().getUsername().equalsIgnoreCase(u)
                                && item.getAlbum().getExternalId().equals(ext));
            }
            if ("save".equals(m)) {
                ListenLaterItem item = (ListenLaterItem) args[0];
                item.setId(UUID.randomUUID());
                listenLaterStore.add(item);
                return item;
            }
            if ("delete".equals(m)) {
                listenLaterStore.remove((ListenLaterItem) args[0]);
                return null;
            }
            return 0L;
        });

        reviewService = new ReviewService(
                reviewRepository,
                trackReviewRepository,
                reviewLikeRepository,
                reviewCommentRepository,
                userFollowRepository,
                listenLaterRepository,
                userService,
                catalogService,
                notificationService
        );

        TopAlbumRepository topAlbumRepository = stubInterface(TopAlbumRepository.class, (proxy, method, args) -> List.of());
        ImageKitService imageKitService = new ImageKitService("", "", "");

        profileService = new ProfileService(
                topAlbumRepository,
                userFollowRepository,
                listenLaterRepository,
                reviewRepository,
                trackReviewRepository,
                userService,
                catalogService,
                reviewService,
                spotifyService,
                imageKitService,
                notificationService
        );
    }

    @Test
    void shouldSavePreciseDecimalRatingWithTwoDecimals() {
        CreateReviewRequest req = new CreateReviewRequest("spotify-1", null, null, 4.89, "Nota exata!");
        ReviewResponse response = reviewService.createOrUpdateReview("ivo", req);
        assertEquals(4.89, response.rating());
    }

    @Test
    void shouldLikeAndCommentOnReviewAndTriggerNotification() {
        UUID reviewId = UUID.randomUUID();
        ReviewResponse liked = reviewService.toggleLike("ana", reviewId);
        assertEquals(1L, liked.likesCount());
        assertTrue(liked.likedByMe());
        assertEquals(1, savedNotifications.size());
        assertEquals("REVIEW_LIKE", savedNotifications.get(0).getType());

        ReviewCommentResponse comment = reviewService.addComment("ana", reviewId, new CreateReviewCommentRequest("Concordo totalmente!"));
        assertEquals("ana", comment.username());
        assertEquals("Concordo totalmente!", comment.content());
        assertEquals(2, savedNotifications.size());
        assertEquals("REVIEW_COMMENT", savedNotifications.get(1).getType());
    }

    @Test
    void shouldCalculateTasteMatchPercentageBetweenUsers() {
        UserProfileResponse profile = profileService.getProfile("ivo", "ana");
        assertNotNull(profile.tasteMatchPercentage());
        assertTrue(profile.tasteMatchPercentage() >= 85);
        assertTrue(profile.commonItemsCount() >= 1);
        assertTrue(profile.followedByMe());
        assertNotNull(profile.badges());
        assertTrue(profile.badges().stream().anyMatch(b -> "pioneer".equals(b.id())));
        assertTrue(profile.badges().stream().anyMatch(b -> "first_review".equals(b.id())));
    }

    @Test
    void shouldToggleListenLaterAndListAlbums() {
        boolean saved = profileService.toggleListenLater("ivo", "spotify-2");
        assertTrue(saved);
        assertTrue(profileService.isSavedInListenLater("ivo", "spotify-2"));

        List<AlbumResponse> items = profileService.getListenLater("ivo");
        assertEquals(1, items.size());
        assertEquals("Kid A", items.get(0).title());

        boolean removed = profileService.toggleListenLater("ivo", "spotify-2");
        assertFalse(removed);
        assertTrue(profileService.getListenLater("ivo").isEmpty());
    }

    @Test
    void shouldRemoveAlbumFromListenLaterAutomaticallyWhenReviewed() {
        assertTrue(profileService.toggleListenLater("ivo", "spotify-2"));
        assertTrue(profileService.toggleListenLater("ana", "spotify-2"));
        assertEquals(1, profileService.getListenLater("ivo").size());
        assertEquals(1, profileService.getListenLater("ana").size());

        // Avaliando uma música do álbum para "ivo" -> deve remover automaticamente da fila Quero Ouvir de "ivo"
        reviewService.createOrUpdateReview(
                "ivo",
                new CreateReviewRequest("spotify-2", 1, "Everything In Its Right Place", 5.0, "Clássico!")
        );
        assertFalse(profileService.isSavedInListenLater("ivo", "spotify-2"));
        assertTrue(profileService.getListenLater("ivo").isEmpty());

        // Avaliando o álbum completo para "ana" -> deve remover automaticamente da fila Quero Ouvir de "ana"
        reviewService.createOrUpdateReview(
                "ana",
                new CreateReviewRequest("spotify-2", null, null, 4.5, "Obra-prima")
        );
        assertFalse(profileService.isSavedInListenLater("ana", "spotify-2"));
        assertTrue(profileService.getListenLater("ana").isEmpty());
    }

    @Test
    void shouldComputeCommunityRankingAndArtistDetail() {
        List<RankedAlbumResponse> ranking = reviewService.getTopRankedAlbums(10);
        assertEquals(1, ranking.size());
        assertEquals("In Rainbows", ranking.get(0).title());
        assertEquals(4.25, ranking.get(0).averageRating());
        assertEquals(2L, ranking.get(0).totalReviews());

        ArtistDetailResponse artist = reviewService.getArtistDetail("Radiohead");
        assertEquals("Radiohead", artist.artistName());
        assertEquals(1, artist.totalAlbums());
        assertEquals(2L, artist.totalReviews());
        assertEquals(4.25, artist.averageRating());
    }
}
