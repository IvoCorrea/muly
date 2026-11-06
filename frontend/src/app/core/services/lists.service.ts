import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AlbumListCommentResponse,
  AlbumListDetailResponse,
  AlbumListSummaryResponse,
  CreateAlbumListRequest,
  CreateListCommentRequest,
  UpdateAlbumListRequest
} from '../models/lists.models';

@Injectable({
  providedIn: 'root'
})
export class ListsService {
  private http = inject(HttpClient);

  public getAllLists(query = ''): Observable<AlbumListSummaryResponse[]> {
    const params = query ? new HttpParams().set('q', query) : undefined;
    return this.http.get<AlbumListSummaryResponse[]>(`${environment.apiUrl}/lists`, { params });
  }

  public getListsByUser(username: string): Observable<AlbumListSummaryResponse[]> {
    return this.http.get<AlbumListSummaryResponse[]>(`${environment.apiUrl}/lists/user/${username}`);
  }

  public getListDetail(id: string): Observable<AlbumListDetailResponse> {
    return this.http.get<AlbumListDetailResponse>(`${environment.apiUrl}/lists/${id}`);
  }

  public createList(request: CreateAlbumListRequest): Observable<AlbumListDetailResponse> {
    return this.http.post<AlbumListDetailResponse>(`${environment.apiUrl}/lists`, request);
  }

  public updateList(id: string, request: UpdateAlbumListRequest): Observable<AlbumListDetailResponse> {
    return this.http.put<AlbumListDetailResponse>(`${environment.apiUrl}/lists/${id}`, request);
  }

  public deleteList(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/lists/${id}`);
  }

  public toggleLike(id: string): Observable<AlbumListDetailResponse> {
    return this.http.post<AlbumListDetailResponse>(`${environment.apiUrl}/lists/${id}/like`, {});
  }

  public addComment(id: string, request: CreateListCommentRequest): Observable<AlbumListCommentResponse> {
    return this.http.post<AlbumListCommentResponse>(`${environment.apiUrl}/lists/${id}/comments`, request);
  }

  public deleteComment(listId: string, commentId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/lists/${listId}/comments/${commentId}`);
  }
}
