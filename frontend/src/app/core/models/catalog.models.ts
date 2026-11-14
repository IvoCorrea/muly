export interface AlbumResponse {
  id: string | null;
  externalId: string;
  title: string;
  artist: string;
  releaseYear: number | null;
  coverUrl: string | null;
}

export interface AlbumTrackResponse {
  trackNumber: number;
  title: string;
  durationMs: number;
}

export interface AlbumDetailResponse {
  id: string | null;
  externalId: string;
  title: string;
  artist: string;
  releaseYear: number | null;
  coverUrl: string | null;
  tracks: AlbumTrackResponse[];
}

export interface TrackSearchResponse {
  title: string;
  artist: string;
  albumTitle: string;
  coverUrl: string | null;
  previewUrl: string | null;
  spotifyUrl?: string | null;
}

export interface RankedAlbumResponse {
  id: string | null;
  externalId: string;
  title: string;
  artist: string;
  releaseYear: number | null;
  coverUrl: string | null;
  averageRating: number | null;
  totalReviews: number;
}

export interface ArtistDetailResponse {
  artistName: string;
  totalAlbums: number;
  totalReviews: number;
  averageRating: number | null;
  albums: RankedAlbumResponse[];
}
