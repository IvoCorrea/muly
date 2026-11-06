import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AlbumResponse } from '../../../core/models/catalog.models';

@Component({
  selector: 'app-album-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="group relative bg-[#1c2228] rounded-md overflow-hidden border border-[#2a343d] hover:border-emerald-500/50 transition-all duration-200 hover:-translate-y-1 shadow-md hover:shadow-emerald-950/20">
      <a
        [routerLink]="['/catalog/albums', album.externalId]"
        class="block"
      >
        <div class="aspect-square w-full bg-[#12161a] overflow-hidden relative">
          @if (album.coverUrl) {
            <img
              [src]="album.coverUrl"
              [alt]="album.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          } @else {
            <div class="w-full h-full flex items-center justify-center text-gray-600">
              <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
          }
        </div>
        <div class="p-3">
          <h3 class="font-semibold text-gray-100 text-sm truncate group-hover:text-emerald-400 transition-colors" [title]="album.title">
            {{ album.title }}
          </h3>
          <p class="text-xs text-gray-400 truncate mt-0.5" [title]="album.artist">
            {{ album.artist }}
          </p>
          <div class="flex items-center justify-between mt-2">
            @if (album.releaseYear) {
              <span class="inline-block text-[10px] font-medium text-gray-500 bg-[#12161a] px-1.5 py-0.5 rounded">
                {{ album.releaseYear }}
              </span>
            } @else {
              <span></span>
            }
          </div>
        </div>
      </a>

      @if (showSpotifyLink && album.externalId) {
        <a
          [href]="'https://open.spotify.com/album/' + album.externalId"
          target="_blank"
          rel="noopener noreferrer"
          (click)="$event.stopPropagation()"
          class="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 bg-[#12161a]/90 hover:bg-[#1DB954] text-[#1DB954] hover:text-black border border-[#1DB954]/40 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors shadow z-10"
          title="Abrir álbum no Spotify"
        >
          <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          <span>Spotify</span>
        </a>
      }
    </div>
  `
})
export class AlbumCardComponent {
  @Input({ required: true }) album!: AlbumResponse;
  @Input() showSpotifyLink = true;
}
