import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AlbumDetailResponse, AlbumResponse } from '../models/catalog.models';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private http = inject(HttpClient);

  public search(query: string): Observable<AlbumResponse[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<AlbumResponse[]>(`${environment.apiUrl}/catalog/search`, { params });
  }

  public getAlbum(spotifyId: string): Observable<AlbumDetailResponse> {
    return this.http.get<AlbumDetailResponse>(`${environment.apiUrl}/catalog/albums/${spotifyId}`);
  }
}
