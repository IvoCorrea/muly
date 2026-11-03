import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AlbumReviewsSummaryResponse,
  CreateReviewRequest,
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

  public getReviewsByAlbum(externalId: string): Observable<AlbumReviewsSummaryResponse> {
    return this.http.get<AlbumReviewsSummaryResponse>(`${environment.apiUrl}/reviews/album/${externalId}`);
  }

  public getReviewsByUser(username: string): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(`${environment.apiUrl}/reviews/user/${username}`);
  }

  public getMyReviewForAlbum(externalId: string): Observable<ReviewResponse> {
    return this.http.get<ReviewResponse>(`${environment.apiUrl}/reviews/me/album/${externalId}`);
  }
}
