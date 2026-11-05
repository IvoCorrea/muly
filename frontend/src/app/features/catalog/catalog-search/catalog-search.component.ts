import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlbumResponse } from '../../../core/models/catalog.models';
import { CatalogService } from '../../../core/services/catalog.service';
import { AlbumCardComponent } from '../../../shared/components/album-card/album-card.component';

@Component({
  selector: 'app-catalog-search',
  standalone: true,
  imports: [CommonModule, FormsModule, AlbumCardComponent],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8">
      
      <!-- Cabeçalho de Busca -->
      <div class="mb-8">
        <h1 class="text-3xl font-black text-white tracking-wide uppercase">Catálogo de Álbuns</h1>
        <p class="text-sm text-gray-400 mt-1">Busque milhões de discos no Spotify e adicione à sua coleção.</p>

        <div class="mt-6 max-w-xl relative">
          <form (ngSubmit)="onSearch()" class="flex gap-3">
            <input
              type="text"
              name="query"
              [(ngModel)]="query"
              (input)="onQueryInput()"
              autocomplete="off"
              placeholder="Digite o nome do álbum ou artista..."
              class="flex-1 bg-[#1b2228] border border-[#2a343d] rounded-lg px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
            />
            <button
              type="submit"
              [disabled]="loading || !query.trim()"
              class="cursor-pointer disabled:cursor-not-allowed bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold px-6 py-3 rounded-lg text-xs uppercase tracking-wider transition-colors"
            >
              {{ loading ? 'Buscando...' : 'Buscar' }}
            </button>
          </form>

          @if (showDropdown && (searchingLive || liveResults.length > 0)) {
            <div class="animate-dropdown absolute left-0 right-0 z-40 bg-[#12161a] border border-[#2a343d] rounded-lg mt-1.5 max-h-64 overflow-y-auto divide-y divide-[#242c34] shadow-2xl">
              @if (searchingLive && liveResults.length === 0) {
                @for (s of [1, 2, 3, 4]; track s) {
                  <div class="p-2.5 flex items-center gap-3">
                    <div class="w-9 h-9 rounded skeleton-shimmer shrink-0"></div>
                    <div class="flex-1 space-y-1.5">
                      <div class="h-3 w-3/5 rounded skeleton-shimmer"></div>
                      <div class="h-2.5 w-2/5 rounded skeleton-shimmer"></div>
                    </div>
                  </div>
                }
              } @else {
                @for (res of liveResults; track res.externalId) {
                  <div
                    (click)="goToAlbum(res.externalId)"
                    class="animate-search-item p-2.5 flex items-center gap-3 cursor-pointer hover:bg-[#202830] transition-colors"
                  >
                    @if (res.coverUrl) {
                      <img [src]="res.coverUrl" [alt]="res.title" class="w-9 h-9 rounded object-cover shrink-0" />
                    } @else {
                      <div class="w-9 h-9 rounded bg-[#202830] shrink-0"></div>
                    }
                    <div class="truncate text-xs">
                      <span class="font-semibold text-gray-200">{{ res.title }}</span>
                      <span class="text-gray-400 ml-1">por {{ res.artist }}</span>
                      @if (res.releaseYear) {
                        <span class="text-gray-500 text-[10px] ml-1">({{ res.releaseYear }})</span>
                      }
                    </div>
                  </div>
                }
              }
            </div>
          }
        </div>
      </div>

      <!-- Resultados -->
      @if (loading) {
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          @for (s of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; track s) {
            <div class="bg-[#1b2228] border border-[#2a343d] rounded-lg p-3 space-y-2.5">
              <div class="aspect-square w-full rounded skeleton-shimmer"></div>
              <div class="h-3.5 w-3/4 rounded skeleton-shimmer"></div>
              <div class="h-2.5 w-1/2 rounded skeleton-shimmer"></div>
            </div>
          }
        </div>
      } @else if (albums.length > 0) {
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          @for (album of albums; track album.externalId) {
            <app-album-card [album]="album" />
          }
        </div>
      } @else if (searched) {
        <div class="text-center py-16 bg-[#1b2228] border border-[#2a343d] rounded-lg">
          <p class="text-gray-300 font-semibold">Nenhum álbum encontrado para "{{ query }}"</p>
          <p class="text-xs text-gray-500 mt-1">Tente buscar por termos mais genéricos ou pelo nome exato do artista.</p>
        </div>
      } @else {
        <!-- Estado inicial / sugestões -->
        <div class="text-center py-16 border border-dashed border-[#2a343d] rounded-lg text-gray-500">
          <p class="text-sm">Use o campo de busca acima para encontrar seus álbuns favoritos.</p>
          <div class="flex flex-wrap justify-center gap-2 mt-4">
            @for (suggestion of ['Abbey Road', 'OK Computer', 'Random Access Memories', 'The Dark Side of the Moon']; track suggestion) {
              <button
                type="button"
                (click)="searchSuggestion(suggestion)"
                class="cursor-pointer text-xs bg-[#1b2228] hover:bg-[#252f38] text-gray-300 border border-[#2a343d] px-3 py-1.5 rounded-full transition-colors"
              >
                {{ suggestion }}
              </button>
            }
          </div>
        </div>
      }

    </div>
  `
})
export class CatalogSearchComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  query = '';
  albums: AlbumResponse[] = [];
  liveResults: AlbumResponse[] = [];
  searchingLive = false;
  showDropdown = false;
  loading = false;
  searched = false;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const q = params['q'];
      if (q) {
        this.query = q;
        this.showDropdown = false;
        this.fetchAlbums(q);
      }
    });
  }

  onQueryInput(): void {
    const q = this.query.trim();
    if (q.length > 1) {
      this.showDropdown = true;
      this.searchingLive = true;
      this.searched = true;
      if (this.albums.length === 0) {
        this.loading = true;
      }
      this.catalogService.search(q).subscribe({
        next: (results) => {
          if (this.query.trim() === q) {
            this.liveResults = results;
            this.albums = results;
            this.searchingLive = false;
            this.loading = false;
          }
        },
        error: () => {
          this.liveResults = [];
          this.searchingLive = false;
          this.loading = false;
        }
      });
    } else {
      this.liveResults = [];
      this.searchingLive = false;
      this.showDropdown = false;
      if (q.length === 0) {
        this.albums = [];
        this.searched = false;
        this.loading = false;
      }
    }
  }

  goToAlbum(externalId: string): void {
    this.showDropdown = false;
    this.searchingLive = false;
    this.liveResults = [];
    this.router.navigate(['/catalog/albums', externalId]);
  }

  onSearch(): void {
    this.showDropdown = false;
    if (this.query.trim()) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { q: this.query.trim() },
        queryParamsHandling: 'merge'
      });
    }
  }

  searchSuggestion(suggestion: string): void {
    this.query = suggestion;
    this.onSearch();
  }

  private fetchAlbums(q: string): void {
    this.loading = true;
    this.searched = true;
    this.catalogService.search(q).subscribe({
      next: (results) => {
        this.albums = results;
        this.loading = false;
      },
      error: () => {
        this.albums = [];
        this.loading = false;
      }
    });
  }
}
