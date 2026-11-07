package com.muly.social;

import com.muly.auth.model.User;
import com.muly.auth.repository.UserRepository;
import com.muly.auth.service.UserService;
import com.muly.catalog.model.Album;
import com.muly.catalog.repository.AlbumRepository;
import com.muly.catalog.service.CatalogService;
import com.muly.catalog.service.SpotifyService;
import com.muly.profile.dto.UserProfileResponse;
import com.muly.profile.model.UserFollow;
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
    private List<Notification> savedNotifications;
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

        AlbumRepository albumRepository = stubInterface(AlbumRepository.class, (proxy, method, args) -> Optional.of(album1));
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

        ReviewRepository reviewRepository = stubInterface(ReviewRepository.class, (proxy, method, args) -> {
            String m = method.getName();
            if ("findById".equals(m)) return Optional.of(reviewIvo);
            if ("save".equals(m)) {
                Review r = (Review) args[0];
                if (r.getId() == null) r.setId(UUID.randomUUID());
                return r;
            }
            if ("findByUserUsernameOrderByCreatedAtDesc".equals(m)) {
                String u = (String) args[0];
                return "ivo".equalsIgnoreCase(u) ? List.of(reviewIvo) : List.of(reviewAna);
            }
            if ("findByAlbumExternalIdOrderByCreatedAtDesc".equals(m)) {
                return List.of(reviewIvo, reviewAna);
            }
            if ("countByUserUsername".equals(m)) return 1L;
            return Optional.empty();
        });

        TrackReviewRepository trackReviewRepository = stubInterface(TrackReviewRepository.class, (proxy, method, args) -> {
            if ("countByUserUsername".equals(method.getName())) return 0L;
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

        reviewService = new ReviewService(
                reviewRepository,
                trackReviewRepository,
                reviewLikeRepository,
                reviewCommentRepository,
                userFollowRepository,
                userService,
                catalogService,
                notificationService
        );

        TopAlbumRepository topAlbumRepository = stubInterface(TopAlbumRepository.class, (proxy, method, args) -> List.of());
        ImageKitService imageKitService = new ImageKitService("", "", "");

        profileService = new ProfileService(
                topAlbumRepository,
                userFollowRepository,
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
    void shouldSaveHalfStarRatingAndNormalizeToHalfStep() {
        CreateReviewRequest req = new CreateReviewRequest("spotify-1", null, null, 3.5, "Três estrelas e meia!");
        ReviewResponse response = reviewService.createOrUpdateReview("ivo", req);
        assertEquals(3.5, response.rating());
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
    }
}
