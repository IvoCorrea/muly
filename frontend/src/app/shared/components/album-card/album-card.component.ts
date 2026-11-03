import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AlbumResponse } from '../../../core/models/catalog.models';

@Component({
  selector: 'app-album-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <a
      [routerLink]="['/catalog/albums', album.externalId]"
      class="group block bg-[#1c2228] rounded-md overflow-hidden border border-[#2a343d] hover:border-emerald-500/50 transition-all duration-200 hover:-translate-y-1 shadow-md hover:shadow-emerald-950/20"
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
        @if (album.releaseYear) {
          <span class="inline-block mt-2 text-[10px] font-medium text-gray-500 bg-[#12161a] px-1.5 py-0.5 rounded">
            {{ album.releaseYear }}
          </span>
        }
      </div>
    </a>
  `
})
export class AlbumCardComponent {
  @Input({ required: true }) album!: AlbumResponse;
}
