import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ArtistDetailResponse, RankedAlbumResponse } from '../../../core/models/catalog.models';
import { CatalogService } from '../../../core/services/catalog.service';
import { formatRating } from '../../../core/utils/rating.utils';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-artist-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, StarRatingComponent],
  template: `
    <div>
      @if (loading) {
        <div class="flex items-center justify-center py-24 text-emerald-400">
          <svg class="animate-spin h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
        </div>
      } @else if (artistDetail) {
        <!-- Banner Hero estilo Last.fm -->
        <section class="relative overflow-hidden bg-[#181e24] border-b border-[#242c34]">
          @if (heroBackgroundUrl) {
            <img
              [src]="heroBackgroundUrl"
              [alt]="artistDetail.artistName"
              class="absolute inset-y-0 right-0 w-full md:w-2/3 h-full object-cover object-center opacity-45 pointer-events-none select-none"
            />
          }
          <div class="absolute inset-0 bg-gradient-to-r from-[#14181c] via-[#14181c]/90 to-[#14181c]/25 pointer-events-none"></div>
          <div class="absolute inset-0 bg-gradient-to-t from-[#14181c] via-transparent to-black/30 pointer-events-none"></div>

          <div class="max-w-6xl mx-auto px-4 py-8 sm:py-12 relative z-10">
            <div class="mb-4">
              <a routerLink="/catalog" class="text-xs font-semibold text-gray-400 hover:text-emerald-400 transition-colors">
                ← Voltar ao Catálogo
              </a>
            </div>

            <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {{ artistDetail.artistName }}
            </h1>

            <!-- Ações e Estatísticas estilo Last.fm -->
            <div class="mt-5 flex flex-wrap items-center gap-5">
              <a
                [href]="artistDetail.spotifyArtistUrl || ('https://open.spotify.com/search/' + encodeArtist(artistDetail.artistName))"
                target="_blank"
                rel="noopener noreferrer"
                class="bg-white hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded inline-flex items-center gap-2 shadow-lg transition-colors"
              >
                <span class="text-sm leading-none">▶</span>
                <span>Reproduzir Artista</span>
              </a>

              <div class="flex flex-wrap items-center gap-6">
                <div>
                  <span class="block text-[11px] text-gray-400 font-medium">Média Geral</span>
                  <span class="text-lg sm:text-xl font-black text-emerald-400 tabular-nums">
                    {{ artistDetail.averageRating !== null ? '★ ' + formatRating(artistDetail.averageRating) : '—' }}
                  </span>
                </div>

                <div>
                  <span class="block text-[11px] text-gray-400 font-medium">Avaliações</span>
                  <span class="text-lg sm:text-xl font-black text-white tabular-nums">{{ artistDetail.totalReviews }}</span>
                </div>

                <div>
                  <span class="block text-[11px] text-gray-400 font-medium">Discos</span>
                  <span class="text-lg sm:text-xl font-black text-white tabular-nums">{{ artistDetail.totalAlbums }}</span>
                </div>
              </div>
            </div>

            <!-- Destaques Horizontais no Rodapé do Hero (Último Lançamento & Mais Bem Avaliado) -->
            @if (latestAlbum || topRatedAlbum) {
              <div class="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                @if (latestAlbum) {
                  <a
                    [routerLink]="['/catalog/albums', latestAlbum.externalId]"
                    class="group flex items-center gap-3.5 bg-[#12161a]/75 hover:bg-[#1b2228]/90 backdrop-blur-sm border border-[#2a343d] hover:border-emerald-500/40 rounded-lg p-2.5 transition-all"
                  >
                    <div class="w-14 h-14 rounded overflow-hidden bg-[#1b2228] shrink-0 border border-[#2a343d]">
                      @if (latestAlbum.coverUrl) {
                        <img [src]="latestAlbum.coverUrl" [alt]="latestAlbum.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      } @else {
                        <div class="w-full h-full flex items-center justify-center text-gray-600">💿</div>
                      }
                    </div>
                    <div class="min-w-0">
                      <span class="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Último Lançamento
                      </span>
                      <p class="text-sm font-black text-white group-hover:text-emerald-400 transition-colors truncate">
                        {{ latestAlbum.title }}
                      </p>
                      <span class="text-[11px] text-gray-400">
                        {{ latestAlbum.releaseYear || 'Catálogo' }}
                      </span>
                    </div>
                  </a>
                }

                @if (topRatedAlbum) {
                  <a
                    [routerLink]="['/catalog/albums', topRatedAlbum.externalId]"
                    class="group flex items-center gap-3.5 bg-[#12161a]/75 hover:bg-[#1b2228]/90 backdrop-blur-sm border border-[#2a343d] hover:border-emerald-500/40 rounded-lg p-2.5 transition-all"
                  >
                    <div class="w-14 h-14 rounded overflow-hidden bg-[#1b2228] shrink-0 border border-[#2a343d]">
                      @if (topRatedAlbum.coverUrl) {
                        <img [src]="topRatedAlbum.coverUrl" [alt]="topRatedAlbum.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      } @else {
                        <div class="w-full h-full flex items-center justify-center text-gray-600">💿</div>
                      }
                    </div>
                    <div class="min-w-0">
                      <span class="block text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        Mais Bem Avaliado
                      </span>
                      <p class="text-sm font-black text-white group-hover:text-emerald-400 transition-colors truncate">
                        {{ topRatedAlbum.title }}
                      </p>
                      <span class="text-[11px] text-gray-300 font-semibold">
                        ★ {{ formatRating(topRatedAlbum.averageRating) }} • {{ topRatedAlbum.totalReviews }} {{ topRatedAlbum.totalReviews === 1 ? 'avaliação' : 'avaliações' }}
                      </span>
                    </div>
                  </a>
                }
              </div>
            }
          </div>
        </section>

        <!-- Discografia Completa -->
        <div class="max-w-6xl mx-auto px-4 py-8">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h2 class="text-xs font-black uppercase tracking-widest text-gray-300">
              Discografia ({{ artistDetail.albums.length }})
            </h2>

            <div class="inline-flex items-center bg-[#181e24] border border-[#2a343d] rounded-lg p-1 self-start sm:self-auto">
              <button
                type="button"
                (click)="sortMode = 'rating'"
                class="cursor-pointer text-xs font-bold px-3 py-1.5 rounded-md transition-colors"
                [ngClass]="sortMode === 'rating' ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:text-white'"
              >
                🏆 Melhor Avaliados
              </button>
              <button
                type="button"
                (click)="sortMode = 'year'"
                class="cursor-pointer text-xs font-bold px-3 py-1.5 rounded-md transition-colors"
                [ngClass]="sortMode === 'year' ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:text-white'"
              >
                📅 Ano de Lançamento
              </button>
            </div>
          </div>

          @if (sortedAlbums.length > 0) {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (album of sortedAlbums; track album.externalId; let i = $index) {
                <a
                  [routerLink]="['/catalog/albums', album.externalId]"
                  class="group bg-[#1b2228] border border-[#2a343d] hover:border-emerald-500/50 rounded-xl p-4 flex items-center gap-4 transition-all hover:-translate-y-0.5 shadow"
                >
                  <div class="w-20 h-20 rounded-lg bg-[#12161a] overflow-hidden shrink-0 border border-[#242c34]">
                    @if (album.coverUrl) {
                      <img [src]="album.coverUrl" [alt]="album.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    } @else {
                      <div class="w-full h-full flex items-center justify-center text-gray-600 text-xl">💿</div>
                    }
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      @if (sortMode === 'rating' && album.averageRating !== null) {
                        <span class="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded">
                          #{{ i + 1 }}
                        </span>
                      }
                      @if (album.releaseYear) {
                        <span class="text-[10px] font-semibold text-gray-500">{{ album.releaseYear }}</span>
                      }
                    </div>
                    <h3 class="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors truncate mt-0.5" [title]="album.title">
                      {{ album.title }}
                    </h3>
                    <p class="text-xs text-gray-400 truncate">{{ album.artist }}</p>

                    <div class="mt-2 flex items-center gap-2">
                      @if (album.averageRating !== null) {
                        <app-star-rating [rating]="album.averageRating" [readonly]="true" [showValue]="false" />
                        <span class="text-xs font-black text-emerald-400">{{ formatRating(album.averageRating) }}</span>
                        <span class="text-[10px] text-gray-500">({{ album.totalReviews }})</span>
                      } @else {
                        <span class="text-[11px] text-gray-500 italic">Ainda sem avaliações</span>
                      }
                    </div>
                  </div>
                </a>
              }
            </div>
          } @else {
            <div class="p-10 border border-dashed border-[#2a343d] rounded-xl text-center text-xs text-gray-500">
              Nenhum álbum encontrado para este artista.
            </div>
          }
        </div>
      } @else {
        <div class="text-center py-20 text-gray-400">
          <p>Artista não encontrado.</p>
          <a routerLink="/catalog" class="text-emerald-400 text-xs font-semibold hover:underline mt-2 inline-block">
            Voltar para o catálogo
          </a>
        </div>
      }
    </div>
  `
})
export class ArtistDetailComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private route = inject(ActivatedRoute);
  private titleService = inject(Title);
  private metaService = inject(Meta);

  artistDetail: ArtistDetailResponse | null = null;
  loading = true;
  sortMode: 'rating' | 'year' = 'rating';

  get heroBackgroundUrl(): string | null {
    if (!this.artistDetail) return null;
    if (this.artistDetail.artistImageUrl) {
      return this.artistDetail.artistImageUrl;
    }
    const withCover = this.artistDetail.albums.find(a => !!a.coverUrl);
    return withCover?.coverUrl || null;
  }

  get latestAlbum(): RankedAlbumResponse | null {
    if (!this.artistDetail || this.artistDetail.albums.length === 0) return null;
    return [...this.artistDetail.albums].sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0))[0];
  }

  get topRatedAlbum(): RankedAlbumResponse | null {
    if (!this.artistDetail) return null;
    const rated = this.artistDetail.albums.filter(a => a.averageRating !== null && a.totalReviews > 0);
    if (rated.length === 0) return null;
    return rated.sort((a, b) => {
      const diff = (b.averageRating || 0) - (a.averageRating || 0);
      if (diff !== 0) return diff;
      return b.totalReviews - a.totalReviews;
    })[0];
  }

  get sortedAlbums(): RankedAlbumResponse[] {
    if (!this.artistDetail) return [];
    const copy = [...this.artistDetail.albums];
    if (this.sortMode === 'year') {
      return copy.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));
    }
    return copy.sort((a, b) => {
      const aHas = a.averageRating !== null ? 0 : 1;
      const bHas = b.averageRating !== null ? 0 : 1;
      if (aHas !== bHas) return aHas - bHas;
      const diff = (b.averageRating || 0) - (a.averageRating || 0);
      if (diff !== 0) return diff;
      const revDiff = b.totalReviews - a.totalReviews;
      if (revDiff !== 0) return revDiff;
      return (b.releaseYear || 0) - (a.releaseYear || 0);
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const name = params.get('name');
      if (name) {
        this.loadArtist(decodeURIComponent(name));
      }
    });
  }

  loadArtist(name: string): void {
    this.loading = true;
    this.catalogService.getArtistDetail(name).subscribe({
      next: (data) => {
        this.artistDetail = data;
        this.loading = false;
        const title = `${data.artistName} — Discografia & Notas | Muly`;
        this.titleService.setTitle(title);
        this.metaService.updateTag({ property: 'og:title', content: title });
      },
      error: () => {
        this.artistDetail = null;
        this.loading = false;
      }
    });
  }

  encodeArtist(name: string): string {
    return encodeURIComponent(name);
  }

  formatRating(value: number | null | undefined): string {
    return formatRating(value);
  }
}
