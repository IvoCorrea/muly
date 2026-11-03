import { AlbumResponse } from './catalog.models';

export interface TopAlbumItemResponse {
  position: number;
  album: AlbumResponse;
}

export interface UserProfileResponse {
  username: string;
  memberSince: string;
  favoriteAlbum: AlbumResponse | null;
  topAlbums: TopAlbumItemResponse[];
  totalReviews: number;
}

export interface SetFavoriteAlbumRequest {
  spotifyId: string | null;
}

export interface TopAlbumItemRequest {
  position: number;
  spotifyId: string;
}

export interface UpdateTopAlbumsRequest {
  topAlbums: TopAlbumItemRequest[];
}
