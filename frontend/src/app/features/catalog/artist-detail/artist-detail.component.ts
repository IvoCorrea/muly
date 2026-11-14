import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ArtistDetailResponse, RankedAlbumResponse } from '../../../core/models/catalog.models';
import { CatalogService } from '../../../core/services/catalog.service';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-artist-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, StarRatingComponent],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8">
      <div class="mb-6">
        <a routerLink="/catalog" class="text-xs font-semibold text-gray-400 hover:text-emerald-400 transition-colors">
          ← Voltar ao Catálogo
        </a>
      </div>

      @if (loading) {
        <div class="flex items-center justify-center py-24 text-emerald-400">
          <svg class="animate-spin h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
        </div>
      } @else if (artistDetail) {
        <!-- Cabeçalho do Artista -->
        <div class="bg-[#1b2228] border border-[#2a343d] rounded-xl p-6 sm:p-8 mb-8 shadow-lg">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span class="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full">
                Artista no Muly
              </span>
              <h1 class="text-3xl sm:text-4xl font-black text-white tracking-tight mt-3">
                {{ artistDetail.artistName }}
              </h1>
              <p class="text-xs text-gray-400 mt-1.5">
                Discografia ordenada pelas notas e avaliações da comunidade Muly.
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <div class="bg-[#12161a] border border-[#242c34] rounded-lg px-4 py-3 text-center min-w-[110px]">
                <span class="block text-[10px] uppercase tracking-wider font-bold text-gray-400">Média Geral</span>
                <span class="text-2xl font-black text-emerald-400">
                  {{ artistDetail.averageRating !== null ? artistDetail.averageRating.toFixed(1) : '—' }}
                </span>
                @if (artistDetail.averageRating !== null) {
                  <span class="text-xs text-gray-500"> / 5.0</span>
                }
              </div>

              <div class="bg-[#12161a] border border-[#242c34] rounded-lg px-4 py-3 text-center min-w-[110px]">
                <span class="block text-[10px] uppercase tracking-wider font-bold text-gray-400">Avaliações</span>
                <span class="text-2xl font-black text-white">{{ artistDetail.totalReviews }}</span>
              </div>

              <div class="bg-[#12161a] border border-[#242c34] rounded-lg px-4 py-3 text-center min-w-[110px]">
                <span class="block text-[10px] uppercase tracking-wider font-bold text-gray-400">Discos</span>
                <span class="text-2xl font-black text-white">{{ artistDetail.totalAlbums }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Seletor de Ordenação -->
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
              🏆 Melhor Avaliados no Muly
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
                      <span class="text-xs font-black text-emerald-400">{{ album.averageRating.toFixed(1) }}</span>
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
      } @else {
        <div class="text-center py-20 text-gray-400">
          <p>Não foi possível carregar os dados deste artista.</p>
          <a routerLink="/catalog" class="text-emerald-400 text-xs font-semibold hover:underline mt-2 inline-block">
            Voltar ao Catálogo
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
}
