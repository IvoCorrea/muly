import { AlbumResponse } from './catalog.models';

export interface AlbumListSummaryResponse {
  id: string;
  title: string;
  description: string | null;
  username: string;
  userDisplayName?: string | null;
  userAvatarUrl?: string | null;
  albumCount: number;
  likesCount: number;
  commentsCount: number;
  previewCovers: string[];
  createdAt: string;
}

export interface AlbumListItemResponse {
  position: number;
  album: AlbumResponse;
  reviewedByMe: boolean;
}

export interface AlbumListCommentResponse {
  id: string;
  username: string;
  userDisplayName?: string | null;
  userAvatarUrl?: string | null;
  content: string;
  createdAt: string;
}

export interface AlbumListDetailResponse {
  id: string;
  title: string;
  description: string | null;
  username: string;
  userDisplayName?: string | null;
  userAvatarUrl?: string | null;
  createdAt: string;
  updatedAt: string | null;
  likesCount: number;
  likedByMe: boolean;
  reviewedPercentage: number;
  items: AlbumListItemResponse[];
  comments: AlbumListCommentResponse[];
}

export interface CreateAlbumListRequest {
  title: string;
  description?: string | null;
  spotifyIds: string[];
}

export interface UpdateAlbumListRequest {
  title: string;
  description?: string | null;
  spotifyIds: string[];
}

export interface CreateListCommentRequest {
  content: string;
}
