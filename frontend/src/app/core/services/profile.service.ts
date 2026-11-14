import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AlbumResponse } from '../models/catalog.models';
import {
  FollowUserResponse,
  SetCurrentTrackRequest,
  SetFavoriteAlbumRequest,
  UpdateFullProfileRequest,
  UpdateProfileInfoRequest,
  UpdateTopAlbumsRequest,
  UploadAvatarRequest,
  UserProfileResponse
} from '../models/profile.models';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private http = inject(HttpClient);

  public getProfile(username: string): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${environment.apiUrl}/profile/${username}`);
  }

  public getMyProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${environment.apiUrl}/profile/me`);
  }

  public updateFullProfile(request: UpdateFullProfileRequest): Observable<UserProfileResponse> {
    return this.http.put<UserProfileResponse>(`${environment.apiUrl}/profile/me`, request);
  }

  public toggleFollow(username: string): Observable<UserProfileResponse> {
    return this.http.post<UserProfileResponse>(`${environment.apiUrl}/profile/${username}/follow`, {});
  }

  public getFollowers(username: string): Observable<FollowUserResponse[]> {
    return this.http.get<FollowUserResponse[]>(`${environment.apiUrl}/profile/${username}/followers`);
  }

  public getFollowing(username: string): Observable<FollowUserResponse[]> {
    return this.http.get<FollowUserResponse[]>(`${environment.apiUrl}/profile/${username}/following`);
  }

  public updateProfileInfo(request: UpdateProfileInfoRequest): Observable<UserProfileResponse> {
    return this.http.put<UserProfileResponse>(`${environment.apiUrl}/profile/me/info`, request);
  }

  public uploadAvatar(base64Image: string): Observable<UserProfileResponse> {
    const payload: UploadAvatarRequest = { base64Image };
    return this.http.post<UserProfileResponse>(`${environment.apiUrl}/profile/me/avatar`, payload);
  }

  public deleteAvatar(): Observable<UserProfileResponse> {
    return this.http.delete<UserProfileResponse>(`${environment.apiUrl}/profile/me/avatar`);
  }

  public setFavoriteAlbum(spotifyId: string | null): Observable<UserProfileResponse> {
    const payload: SetFavoriteAlbumRequest = { spotifyId };
    return this.http.put<UserProfileResponse>(`${environment.apiUrl}/profile/me/favorite-album`, payload);
  }

  public setCurrentTrack(request: SetCurrentTrackRequest): Observable<UserProfileResponse> {
    return this.http.put<UserProfileResponse>(`${environment.apiUrl}/profile/me/current-track`, request);
  }

  public updateTopAlbums(request: UpdateTopAlbumsRequest): Observable<UserProfileResponse> {
    return this.http.put<UserProfileResponse>(`${environment.apiUrl}/profile/me/top-albums`, request);
  }

  public getListenLater(username: string): Observable<AlbumResponse[]> {
    return this.http.get<AlbumResponse[]>(`${environment.apiUrl}/profile/${username}/listen-later`);
  }

  public getListenLaterStatus(spotifyId: string): Observable<{ saved: boolean }> {
    return this.http.get<{ saved: boolean }>(`${environment.apiUrl}/profile/me/listen-later/${spotifyId}`);
  }

  public toggleListenLater(spotifyId: string): Observable<{ saved: boolean }> {
    return this.http.post<{ saved: boolean }>(`${environment.apiUrl}/profile/me/listen-later/${spotifyId}`, {});
  }

  public importLastfmTopAlbums(lastfmUsernameOrUrl: string): Observable<AlbumResponse[]> {
    const params = new HttpParams().set('username', lastfmUsernameOrUrl);
    return this.http.get<AlbumResponse[]>(`${environment.apiUrl}/profile/me/lastfm/top-albums`, { params });
  }
}
