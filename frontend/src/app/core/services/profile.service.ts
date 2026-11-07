import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SetCurrentTrackRequest,
  SetFavoriteAlbumRequest,
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
}
