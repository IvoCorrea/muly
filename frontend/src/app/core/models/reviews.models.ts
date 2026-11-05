export interface ReviewResponse {
  id: string;
  username: string;
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
}

export interface AlbumReviewsSummaryResponse {
  averageRating: number | null;
  totalReviews: number;
  reviews: ReviewResponse[];
  trackReviews: ReviewResponse[];
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
