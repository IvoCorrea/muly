import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AlbumReviewsSummaryResponse,
  CreateReviewCommentRequest,
  CreateReviewRequest,
  ReviewCommentResponse,
  ReviewResponse,
  UpdateReviewRequest
} from '../models/reviews.models';

@Injectable({
  providedIn: 'root'
})
export class ReviewsService {
  private http = inject(HttpClient);

  public createOrUpdateReview(request: CreateReviewRequest): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(`${environment.apiUrl}/reviews`, request);
  }

  public updateReview(id: string, request: UpdateReviewRequest): Observable<ReviewResponse> {
    return this.http.put<ReviewResponse>(`${environment.apiUrl}/reviews/${id}`, request);
  }

  public deleteReview(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/reviews/${id}`);
  }

  public toggleLike(reviewId: string): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(`${environment.apiUrl}/reviews/${reviewId}/like`, {});
  }

  public addComment(reviewId: string, request: CreateReviewCommentRequest): Observable<ReviewCommentResponse> {
    return this.http.post<ReviewCommentResponse>(`${environment.apiUrl}/reviews/${reviewId}/comments`, request);
  }

  public deleteComment(reviewId: string, commentId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/reviews/${reviewId}/comments/${commentId}`);
  }

  public getFeed(tab: 'trending' | 'following' | 'recent' = 'trending'): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(`${environment.apiUrl}/reviews/feed?tab=${tab}`);
  }

  public getReviewsByAlbum(externalId: string): Observable<AlbumReviewsSummaryResponse> {
    return this.http.get<AlbumReviewsSummaryResponse>(`${environment.apiUrl}/reviews/album/${externalId}`);
  }

  public getReviewsByUser(username: string): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(`${environment.apiUrl}/reviews/user/${username}`);
  }

  public getMyReviewForAlbum(externalId: string): Observable<ReviewResponse> {
    return this.http.get<ReviewResponse>(`${environment.apiUrl}/reviews/me/album/${externalId}`);
  }

  public getMyTrackReviewsForAlbum(externalId: string): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(`${environment.apiUrl}/reviews/me/album/${externalId}/tracks`);
  }
}
