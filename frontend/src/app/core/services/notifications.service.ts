import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationResponse, NotificationSummaryResponse } from '../models/social.models';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private http = inject(HttpClient);

  public getMyNotifications(): Observable<NotificationSummaryResponse> {
    return this.http.get<NotificationSummaryResponse>(`${environment.apiUrl}/notifications`);
  }

  public markAllAsRead(): Observable<NotificationSummaryResponse> {
    return this.http.put<NotificationSummaryResponse>(`${environment.apiUrl}/notifications/read-all`, {});
  }

  public markAsRead(id: string): Observable<NotificationResponse> {
    return this.http.put<NotificationResponse>(`${environment.apiUrl}/notifications/${id}/read`, {});
  }
}
