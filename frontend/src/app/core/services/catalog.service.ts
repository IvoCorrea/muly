import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AlbumDetailResponse, AlbumResponse, TrackSearchResponse } from '../models/catalog.models';

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

  public searchTracks(query: string): Observable<TrackSearchResponse[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<TrackSearchResponse[]>(`${environment.apiUrl}/catalog/tracks/search`, { params }).pipe(
      catchError(() => this.searchTracksItunesDirect(query))
    );
  }

  public searchTracksItunesDirect(query: string): Observable<TrackSearchResponse[]> {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=8`;
    return this.http.get<{ results?: any[] }>(url).pipe(
      map(res =>
        (res.results || [])
          .filter(item => !!item.previewUrl)
          .map(item => ({
            title: item.trackName || '',
            artist: item.artistName || '',
            albumTitle: item.collectionName || '',
            coverUrl: item.artworkUrl100 ? String(item.artworkUrl100).replace('100x100bb', '300x300bb') : null,
            previewUrl: item.previewUrl || null,
            spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(`${item.trackName || ''} ${item.artistName || ''}`.trim())}`
          }))
      ),
      catchError(() => of([]))
    );
  }
}
