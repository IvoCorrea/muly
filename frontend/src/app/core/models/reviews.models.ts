export interface ReviewCommentResponse {
  id: string;
  reviewId: string;
  username: string;
  userDisplayName?: string | null;
  userAvatarUrl?: string | null;
  content: string;
  createdAt: string;
}

export interface CreateReviewCommentRequest {
  content: string;
}

export interface ReviewResponse {
  id: string;
  username: string;
  userDisplayName?: string | null;
  userAvatarUrl?: string | null;
  albumExternalId: string;
  albumTitle: string;
  albumArtist: string;
  albumCoverUrl: string | null;
  albumReleaseYear: number | null;
  trackNumber: number | null;
  trackTitle: string | null;
  rating: number;
  reviewText: string | null;
  createdAt: string;
  updatedAt: string | null;
  likesCount?: number;
  likedByMe?: boolean;
  commentsCount?: number;
  comments?: ReviewCommentResponse[];
}

export interface AlbumReviewsSummaryResponse {
  averageRating: number | null;
  totalReviews: number;
  reviews: ReviewResponse[];
  trackReviews: ReviewResponse[];
  friendsReviews?: ReviewResponse[];
}

export interface CreateReviewRequest {
  spotifyId: string;
  trackNumber?: number | null;
  trackTitle?: string | null;
  rating: number;
  reviewText?: string;
}

export interface UpdateReviewRequest {
  rating: number;
  reviewText?: string;
}
