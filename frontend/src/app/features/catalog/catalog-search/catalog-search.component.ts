import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AlbumResponse, RankedAlbumResponse } from '../../../core/models/catalog.models';
import { CatalogService } from '../../../core/services/catalog.service';
import { AlbumCardComponent } from '../../../shared/components/album-card/album-card.component';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-catalog-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AlbumCardComponent, StarRatingComponent],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8">
      
      <!-- Cabeçalho & Abas -->
      <div class="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl font-black text-white tracking-wide uppercase">Catálogo de Álbuns</h1>
          <p class="text-sm text-gray-400 mt-1">
            {{ activeTab === 'search' ? 'Busque milhões de discos no Spotify e adicione à sua coleção.' : 'Os discos mais bem avaliados pela comunidade do Muly.' }}
          </p>
        </div>

        <div class="inline-flex items-center bg-[#181e24] border border-[#2a343d] rounded-lg p-1 self-start sm:self-auto">
          <button
            type="button"
            (click)="selectTab('search')"
            class="cursor-pointer text-xs font-bold px-3.5 py-2 rounded-md transition-colors"
            [ngClass]="activeTab === 'search' ? 'bg-emerald-500 text-black shadow' : 'text-gray-400 hover:text-white'"
          >
            🔍 Buscar no Catálogo
          </button>
          <button
            type="button"
            (click)="selectTab('ranking')"
            class="cursor-pointer text-xs font-bold px-3.5 py-2 rounded-md transition-colors"
            [ngClass]="activeTab === 'ranking' ? 'bg-emerald-500 text-black shadow' : 'text-gray-400 hover:text-white'"
          >
            🏆 Top Álbuns da Comunidade
          </button>
        </div>
      </div>

      @if (activeTab === 'search') {
        <!-- Busca -->
        <div #searchContainer class="mb-8 max-w-xl relative">
          <form (ngSubmit)="onSearch()" class="flex gap-3">
            <input
              type="text"
              name="query"
              [(ngModel)]="query"
              (focus)="onQueryFocus()"
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
      } @else {
        <!-- Aba: Ranking Global da Comunidade -->
        @if (loadingRanking) {
          <div class="space-y-3">
            @for (s of [1, 2, 3, 4, 5, 6]; track s) {
              <div class="bg-[#1b2228] border border-[#2a343d] rounded-xl p-4 flex items-center gap-4">
                <div class="w-8 h-8 rounded skeleton-shimmer shrink-0"></div>
                <div class="w-14 h-14 rounded skeleton-shimmer shrink-0"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-4 w-1/3 rounded skeleton-shimmer"></div>
                  <div class="h-3 w-1/4 rounded skeleton-shimmer"></div>
                </div>
              </div>
            }
          </div>
        } @else if (rankedAlbums.length > 0) {
          <div class="space-y-3">
            @for (album of rankedAlbums; track album.externalId; let i = $index) {
              <div class="bg-[#1b2228] border border-[#2a343d] hover:border-emerald-500/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                <div class="flex items-center gap-4 min-w-0">
                  <span
                    class="w-9 h-9 rounded-lg font-black text-sm flex items-center justify-center shrink-0 border"
                    [ngClass]="i === 0
                      ? 'bg-amber-400 text-black border-amber-300 shadow'
                      : i === 1
                        ? 'bg-gray-300 text-black border-gray-200'
                        : i === 2
                          ? 'bg-amber-700/80 text-white border-amber-600'
                          : 'bg-[#12161a] text-gray-400 border-[#242c34]'"
                  >
                    #{{ i + 1 }}
                  </span>

                  <a [routerLink]="['/catalog/albums', album.externalId]" class="shrink-0">
                    @if (album.coverUrl) {
                      <img [src]="album.coverUrl" [alt]="album.title" class="w-16 h-16 rounded-lg object-cover border border-[#2a343d] shadow" loading="lazy" />
                    } @else {
                      <div class="w-16 h-16 rounded-lg bg-[#12161a] flex items-center justify-center text-gray-600">💿</div>
                    }
                  </a>

                  <div class="min-w-0">
                    <a
                      [routerLink]="['/catalog/albums', album.externalId]"
                      class="font-black text-base text-white hover:text-emerald-400 transition-colors block truncate"
                      [title]="album.title"
                    >
                      {{ album.title }}
                    </a>
                    <div class="flex flex-wrap items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                      <a
                        [routerLink]="['/catalog/artists', getPrimaryArtist(album.artist)]"
                        class="text-emerald-400 font-semibold hover:underline truncate"
                      >
                        {{ album.artist }}
                      </a>
                      @if (album.releaseYear) {
                        <span class="text-gray-500">• {{ album.releaseYear }}</span>
                      }
                    </div>
                  </div>
                </div>

                <div class="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#242c34] shrink-0">
                  <div class="flex items-center gap-2">
                    <app-star-rating [rating]="album.averageRating || 0" [readonly]="true" [showValue]="false" />
                    <span class="text-base font-black text-white">
                      {{ album.averageRating !== null ? album.averageRating.toFixed(1) : '—' }}
                    </span>
                  </div>
                  <span class="text-[11px] font-semibold text-gray-400 bg-[#12161a] border border-[#242c34] px-2.5 py-1 rounded-full">
                    {{ album.totalReviews }} {{ album.totalReviews === 1 ? 'avaliação' : 'avaliações' }}
                  </span>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="text-center py-16 bg-[#1b2228] border border-dashed border-[#2a343d] rounded-xl text-gray-400">
            <p class="text-sm font-semibold">Ainda não há álbuns avaliados no ranking.</p>
            <p class="text-xs text-gray-500 mt-1">Avalie álbuns no catálogo para inaugurar o Top 50 do Muly!</p>
          </div>
        }
      }

    </div>
  `
})
export class CatalogSearchComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChild('searchContainer') searchContainer?: ElementRef<HTMLElement>;

  activeTab: 'search' | 'ranking' = 'search';

  query = '';
  albums: AlbumResponse[] = [];
  liveResults: AlbumResponse[] = [];
  searchingLive = false;
  showDropdown = false;
  loading = false;
  searched = false;

  rankedAlbums: RankedAlbumResponse[] = [];
  loadingRanking = false;
  rankingLoaded = false;

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showDropdown && !this.searchingLive) return;
    if (this.searchContainer && !this.searchContainer.nativeElement.contains(event.target as Node)) {
      this.showDropdown = false;
      this.searchingLive = false;
    }
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const q = params['q'];
      const tab = params['tab'];
      if (tab === 'ranking') {
        this.activeTab = 'ranking';
        this.loadRanking();
        return;
      }
      if (q) {
        this.activeTab = 'search';
        this.query = q;
        this.showDropdown = false;
        this.searchingLive = false;
        this.fetchAlbums(q);
      }
    });
  }

  selectTab(tab: 'search' | 'ranking'): void {
    this.activeTab = tab;
    if (tab === 'ranking') {
      this.loadRanking();
    }
  }

  loadRanking(): void {
    if (this.rankingLoaded) return;
    this.loadingRanking = true;
    this.catalogService.getRanking(50).subscribe({
      next: (items) => {
        this.rankedAlbums = items || [];
        this.loadingRanking = false;
        this.rankingLoaded = true;
      },
      error: () => {
        this.rankedAlbums = [];
        this.loadingRanking = false;
      }
    });
  }

  getPrimaryArtist(artist: string): string {
    if (!artist) return '';
    return artist.split(',')[0].trim();
  }

  onQueryFocus(): void {
    if (this.query.trim().length > 1) {
      this.showDropdown = true;
    }
  }

  onQueryInput(): void {
    const q = this.query.trim();
    this.albums = [];
    this.searched = false;
    this.loading = false;

    if (q.length > 1) {
      this.showDropdown = true;
      this.searchingLive = true;
      this.catalogService.search(q).subscribe({
        next: (results) => {
          if (this.query.trim() === q) {
            this.liveResults = results;
            this.searchingLive = false;
          }
        },
        error: () => {
          this.liveResults = [];
          this.searchingLive = false;
        }
      });
    } else {
      this.liveResults = [];
      this.searchingLive = false;
      this.showDropdown = false;
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
    this.searchingLive = false;
    const q = this.query.trim();
    if (q) {
      this.fetchAlbums(q);
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { q },
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
