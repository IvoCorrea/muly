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
  spotifyUrl?: string | null;
}

export interface UserProfileResponse {
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  spotifyProfileUrl: string | null;
  lastfmProfileUrl: string | null;
  memberSince: string;
  favoriteAlbum: AlbumResponse | null;
  currentTrack: CurrentTrackResponse | null;
  topAlbums: TopAlbumItemResponse[];
  totalReviews: number;
}

export interface UpdateProfileInfoRequest {
  displayName?: string | null;
  bio?: string | null;
  spotifyProfileUrl?: string | null;
  lastfmProfileUrl?: string | null;
}

export interface UploadAvatarRequest {
  base64Image: string;
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
  spotifyUrl?: string | null;
}

export interface TopAlbumItemRequest {
  position: number;
  spotifyId: string;
}

export interface UpdateTopAlbumsRequest {
  topAlbums: TopAlbumItemRequest[];
}
