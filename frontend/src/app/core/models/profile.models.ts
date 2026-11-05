import { AlbumResponse } from './catalog.models';

export interface TopAlbumItemResponse {
  position: number;
  album: AlbumResponse;
}

export interface CurrentTrackResponse {
  title: string;
  artist: string | null;
  albumTitle: string | null;
  coverUrl: string | null;
  previewUrl: string | null;
}

export interface UserProfileResponse {
  username: string;
  memberSince: string;
  favoriteAlbum: AlbumResponse | null;
  currentTrack: CurrentTrackResponse | null;
  topAlbums: TopAlbumItemResponse[];
  totalReviews: number;
}

export interface SetFavoriteAlbumRequest {
  spotifyId: string | null;
}

export interface SetCurrentTrackRequest {
  title: string | null;
  artist?: string | null;
  albumTitle?: string | null;
  coverUrl?: string | null;
  previewUrl?: string | null;
}

export interface TopAlbumItemRequest {
  position: number;
  spotifyId: string;
}

export interface UpdateTopAlbumsRequest {
  topAlbums: TopAlbumItemRequest[];
}
