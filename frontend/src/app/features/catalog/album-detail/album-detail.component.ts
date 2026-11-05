import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AlbumDetailResponse } from '../../../core/models/catalog.models';
import { AlbumReviewsSummaryResponse, ReviewResponse } from '../../../core/models/reviews.models';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { ReviewsService } from '../../../core/services/reviews.service';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-album-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StarRatingComponent],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8">
      
      @if (loading) {
        <div class="flex items-center justify-center py-24 text-emerald-400">
          <svg class="animate-spin h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
        </div>
      } @else if (album) {
        
        <!-- Header do Álbum -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-[#242c34]">
          
          <!-- Capa -->
          <div class="flex justify-center md:justify-start">
            <div class="w-64 h-64 sm:w-72 sm:h-72 rounded-lg overflow-hidden shadow-2xl border border-[#2a343d] bg-[#12161a]">
              @if (album.coverUrl) {
                <img [src]="album.coverUrl" [alt]="album.title" class="w-full h-full object-cover" />
              } @else {
                <div class="w-full h-full flex items-center justify-center text-gray-600">Sem Capa</div>
              }
            </div>
          </div>

          <!-- Metadados & Ação de Review -->
          <div class="md:col-span-2 flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-3">
                <span class="text-xs font-bold text-gray-400 uppercase tracking-widest bg-[#1c2228] px-2.5 py-1 rounded">
                  Álbum
                </span>
                @if (album.releaseYear) {
                  <span class="text-xs text-gray-500 font-semibold">{{ album.releaseYear }}</span>
                }
              </div>

              <h1 class="text-3xl sm:text-4xl font-black text-white mt-2 tracking-tight">
                {{ album.title }}
              </h1>
              <p class="text-lg text-emerald-400 font-medium mt-1">
                {{ album.artist }}
              </p>

              <!-- Média de Avaliações -->
              <div class="flex items-center gap-4 mt-4 py-3 px-4 bg-[#1b2228] rounded-lg border border-[#2a343d] w-fit">
                <div>
                  <span class="text-2xl font-black text-white">
                    {{ reviewsSummary?.averageRating ? (reviewsSummary?.averageRating?.toFixed(1)) : '—' }}
                  </span>
                  <span class="text-xs text-gray-500"> / 5.0</span>
                </div>
                <div class="h-6 w-px bg-[#2a343d]"></div>
                <div>
                  <app-star-rating [rating]="reviewsSummary?.averageRating || 0" [readonly]="true" [showValue]="false" />
                  <span class="text-[11px] text-gray-400">
                    {{ reviewsSummary?.totalReviews || 0 }} {{ reviewsSummary?.totalReviews === 1 ? 'avaliação' : 'avaliações' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Caixa de Avaliação do Usuário -->
            <div class="mt-6 bg-[#161b20] border border-[#2a343d] rounded-lg p-5">
              @if (authService.isAuthenticated()) {
                <h3 class="text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                  {{ myReview ? 'Sua Avaliação' : 'Avalie este álbum' }}
                </h3>

                <div class="flex items-center gap-4 mb-3">
                  <app-star-rating
                    [rating]="userRating"
                    [readonly]="false"
                    (ratingChange)="onRatingSelected($event)"
                  />
                  <span class="text-xs text-gray-400">Clique para selecionar a nota</span>
                </div>

                <textarea
                  [(ngModel)]="userReviewText"
                  rows="3"
                  placeholder="Escreva sua resenha ou pensamentos sobre este disco (opcional)..."
                  class="w-full bg-[#101417] border border-[#242c34] rounded p-3 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                ></textarea>

                <div class="flex items-center justify-between mt-3">
                  @if (myReview) {
                    <button
                      type="button"
                      (click)="deleteReview()"
                      [disabled]="savingReview"
                      class="cursor-pointer disabled:cursor-not-allowed text-xs text-red-400 hover:text-red-300 hover:underline"
                    >
                      Excluir minha review
                    </button>
                  } @else {
                    <div></div>
                  }

                  <button
                    type="button"
                    (click)="saveReview()"
                    [disabled]="savingReview || userRating === 0"
                    class="cursor-pointer disabled:cursor-not-allowed bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold px-4 py-2 rounded text-xs uppercase tracking-wider transition-colors"
                  >
                    {{ savingReview ? 'Salvando...' : (myReview ? 'Atualizar Review' : 'Publicar Review') }}
                  </button>
                </div>
              } @else {
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-sm font-semibold text-gray-200">Quer avaliar este álbum?</h3>
                    <p class="text-xs text-gray-400 mt-0.5">Faça login para dar sua nota e registrar sua resenha.</p>
                  </div>
                  <a
                    routerLink="/login"
                    class="bg-[#242c34] hover:bg-[#2f3944] text-emerald-400 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded transition-colors"
                  >
                    Entrar
                  </a>
                </div>
              }
            </div>

          </div>
        </div>

        <!-- Seções: Faixas e Reviews -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
          
          <!-- Faixas do Disco -->
          <div class="lg:col-span-1">
            <h2 class="text-sm font-black text-gray-200 uppercase tracking-widest mb-4">
              Faixas ({{ album.tracks.length }})
            </h2>

            @if (album.tracks.length > 0) {
              <div class="bg-[#1b2228] border border-[#2a343d] rounded-lg divide-y divide-[#242c34] overflow-hidden text-xs">
                @for (track of album.tracks; track track.trackNumber) {
                  <div class="px-4 py-2.5 flex items-center justify-between hover:bg-[#222b33] transition-colors">
                    <div class="flex items-center gap-3 truncate">
                      <span class="text-gray-500 font-mono text-[11px] w-4 text-right">{{ track.trackNumber }}</span>
                      <span class="text-gray-300 truncate font-medium">{{ track.title }}</span>
                    </div>
                    <span class="text-gray-500 text-[11px] font-mono ml-2">
                      {{ formatDuration(track.durationMs) }}
                    </span>
                  </div>
                }
              </div>
            } @else {
              <p class="text-xs text-gray-500">Tracklist indisponível.</p>
            }
          </div>

          <!-- Resenhas da Comunidade -->
          <div class="lg:col-span-2">
            <h2 class="text-sm font-black text-gray-200 uppercase tracking-widest mb-4">
              Resenhas da Comunidade ({{ reviewsSummary?.totalReviews || 0 }})
            </h2>

            @if (reviewsSummary?.reviews && reviewsSummary!.reviews.length > 0) {
              <div class="space-y-4">
                @for (rev of reviewsSummary!.reviews; track rev.id) {
                  <div class="bg-[#1b2228] border border-[#2a343d] rounded-lg p-5">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-2">
                        <a
                          [routerLink]="['/profile', rev.username]"
                          class="font-bold text-sm text-gray-100 hover:text-emerald-400 transition-colors"
                        >
                          {{ rev.username }}
                        </a>
                        <span class="text-[11px] text-gray-500">• {{ formatDate(rev.createdAt) }}</span>
                      </div>
                      <app-star-rating [rating]="rev.rating" [readonly]="true" />
                    </div>

                    @if (rev.reviewText) {
                      <p class="text-xs text-gray-300 leading-relaxed mt-2 whitespace-pre-wrap">
                        {{ rev.reviewText }}
                      </p>
                    }
                  </div>
                }
              </div>
            } @else {
              <div class="text-center py-12 bg-[#1b2228] border border-[#2a343d] rounded-lg text-gray-500 text-xs">
                Ainda não há resenhas para este álbum. Seja o primeiro a avaliar!
              </div>
            }
          </div>

        </div>

      } @else {
        <div class="text-center py-20 text-gray-400">
          <p>Álbum não encontrado.</p>
          <a routerLink="/catalog" class="text-emerald-400 text-xs font-semibold hover:underline mt-2 inline-block">
            Voltar para a busca
          </a>
        </div>
      }

    </div>
  `
})
export class AlbumDetailComponent implements OnInit {
  authService = inject(AuthService);
  private catalogService = inject(CatalogService);
  private reviewsService = inject(ReviewsService);
  private route = inject(ActivatedRoute);

  album: AlbumDetailResponse | null = null;
  reviewsSummary: AlbumReviewsSummaryResponse | null = null;
  myReview: ReviewResponse | null = null;

  loading = true;
  savingReview = false;

  userRating: number = 0;
  userReviewText: string = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const spotifyId = params.get('spotifyId');
      if (spotifyId) {
        this.loadAlbumData(spotifyId);
      }
    });
  }

  loadAlbumData(spotifyId: string): void {
    this.loading = true;
    this.catalogService.getAlbum(spotifyId).subscribe({
      next: (data) => {
        this.album = data;
        this.loadReviews(spotifyId);
        if (this.authService.isAuthenticated()) {
          this.loadMyReview(spotifyId);
        } else {
          this.loading = false;
        }
      },
      error: () => {
        this.album = null;
        this.loading = false;
      }
    });
  }

  loadReviews(spotifyId: string): void {
    this.reviewsService.getReviewsByAlbum(spotifyId).subscribe({
      next: (summary) => {
        this.reviewsSummary = summary;
      }
    });
  }

  loadMyReview(spotifyId: string): void {
    this.reviewsService.getMyReviewForAlbum(spotifyId).subscribe({
      next: (rev) => {
        this.myReview = rev;
        if (rev) {
          this.userRating = rev.rating;
          this.userReviewText = rev.reviewText || '';
        }
        this.loading = false;
      },
      error: () => {
        this.myReview = null;
        this.loading = false;
      }
    });
  }

  onRatingSelected(rating: number): void {
    this.userRating = rating;
  }

  saveReview(): void {
    if (!this.album || this.userRating === 0) return;

    this.savingReview = true;
    this.reviewsService.createOrUpdateReview({
      spotifyId: this.album.externalId,
      rating: this.userRating,
      reviewText: this.userReviewText.trim()
    }).subscribe({
      next: (saved) => {
        this.myReview = saved;
        this.savingReview = false;
        if (this.album) {
          this.loadReviews(this.album.externalId);
        }
      },
      error: () => {
        this.savingReview = false;
      }
    });
  }

  deleteReview(): void {
    if (!this.myReview || !this.album) return;

    this.savingReview = true;
    this.reviewsService.deleteReview(this.myReview.id).subscribe({
      next: () => {
        this.myReview = null;
        this.userRating = 0;
        this.userReviewText = '';
        this.savingReview = false;
        if (this.album) {
          this.loadReviews(this.album.externalId);
        }
      },
      error: () => {
        this.savingReview = false;
      }
    });
  }

  formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
