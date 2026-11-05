import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AlbumDetailResponse, AlbumTrackResponse } from '../../../core/models/catalog.models';
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
        
        <!-- Header do ├ülbum -->
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

          <!-- Metadados & A├º├úo de Review -->
          <div class="md:col-span-2 flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-3">
                <span class="text-xs font-bold text-gray-400 uppercase tracking-widest bg-[#1c2228] px-2.5 py-1 rounded">
                  ├ülbum
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

              <!-- M├®dia de Avalia├º├Áes -->
              <div class="flex flex-wrap items-center gap-4 mt-4">
                <div class="flex items-center gap-4 py-3 px-4 bg-[#1b2228] rounded-lg border border-[#2a343d] w-fit">
                  <div>
                    <span class="text-[10px] uppercase tracking-wider font-bold text-gray-400 block">M├®dia do ├ülbum</span>
                    <span class="text-2xl font-black text-white">
                      {{ reviewsSummary?.averageRating ? (reviewsSummary?.averageRating?.toFixed(1)) : 'ÔÇö' }}
                    </span>
                    <span class="text-xs text-gray-500"> / 5.0</span>
                  </div>
                  <div class="h-8 w-px bg-[#2a343d]"></div>
                  <div>
                    <app-star-rating [rating]="reviewsSummary?.averageRating || 0" [readonly]="true" [showValue]="false" />
                    <span class="text-[11px] text-gray-400">
                      {{ reviewsSummary?.totalReviews || 0 }} {{ reviewsSummary?.totalReviews === 1 ? 'avalia├º├úo' : 'avalia├º├Áes' }}
                    </span>
                  </div>
                </div>

                @if (selectedTrack) {
                  <div class="flex items-center gap-4 py-3 px-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30 w-fit">
                    <div>
                      <span class="text-[10px] uppercase tracking-wider font-bold text-emerald-400 block truncate max-w-[180px]">
                        Faixa #{{ selectedTrack.trackNumber }} ÔÇó {{ selectedTrack.title }}
                      </span>
                      <span class="text-2xl font-black text-white">
                        {{ getTrackAverageRating(selectedTrack.trackNumber) !== null ? getTrackAverageRating(selectedTrack.trackNumber)!.toFixed(1) : 'ÔÇö' }}
                      </span>
                      <span class="text-xs text-gray-400"> / 5.0</span>
                    </div>
                    <div class="h-8 w-px bg-emerald-500/20"></div>
                    <div>
                      <app-star-rating [rating]="getTrackAverageRating(selectedTrack.trackNumber) || 0" [readonly]="true" [showValue]="false" />
                      <span class="text-[11px] text-emerald-300">
                        {{ getTrackReviewsCount(selectedTrack.trackNumber) }} {{ getTrackReviewsCount(selectedTrack.trackNumber) === 1 ? 'avalia├º├úo da faixa' : 'avalia├º├Áes da faixa' }}
                      </span>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Caixa de Avalia├º├úo do Usu├írio -->
            <div class="mt-6 bg-[#161b20] border border-[#2a343d] rounded-lg p-5">
              @if (authService.isAuthenticated()) {
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#242c34]">
                  <div>
                    <div class="flex items-center gap-2">
                      <span
                        class="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                        [ngClass]="selectedTrack ? 'bg-emerald-500 text-black' : 'bg-[#242c34] text-emerald-400'"
                      >
                        {{ selectedTrack ? 'Avaliando M├║sica' : 'Avaliando ├ülbum Completo' }}
                      </span>
                      @if (selectedTrack) {
                        <button
                          type="button"
                          (click)="selectTrack(null)"
                          class="cursor-pointer text-[11px] text-gray-400 hover:text-white underline"
                        >
                          Voltar para o ├ílbum
                        </button>
                      }
                    </div>
                    <h3 class="text-sm font-bold text-white mt-1.5">
                      @if (selectedTrack) {
                        #{{ selectedTrack.trackNumber }} - {{ selectedTrack.title }}
                      } @else {
                        {{ album.title }} (├ülbum Completo)
                      }
                    </h3>
                  </div>

                  <!-- Seletor r├ípido de faixa ou ├ílbum -->
                  @if (album.tracks.length > 0) {
                    <div class="flex items-center gap-2">
                      <label class="text-[11px] text-gray-400 font-semibold whitespace-nowrap">Escolher:</label>
                      <select
                        [ngModel]="selectedTrack?.trackNumber || 0"
                        (ngModelChange)="onTrackDropdownChange($event)"
                        class="bg-[#101417] border border-[#2a343d] rounded px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500 max-w-[220px]"
                      >
                        <option [ngValue]="0">­ƒÆ┐ ├ülbum Completo</option>
                        @for (track of album.tracks; track track.trackNumber) {
                          <option [ngValue]="track.trackNumber">
                            ­ƒÄÁ {{ track.trackNumber }}. {{ track.title }} {{ getMyTrackReview(track.trackNumber) ? ' (Ôÿà ' + getMyTrackReview(track.trackNumber)!.rating + ')' : '' }}
                          </option>
                        }
                      </select>
                    </div>
                  }
                </div>

                <div class="flex items-center gap-4 mb-3">
                  <app-star-rating
                    [rating]="userRating"
                    [readonly]="false"
                    (ratingChange)="onRatingSelected($event)"
                  />
                  <span class="text-xs text-gray-400">
                    {{ currentActiveReview ? 'Sua nota salva (clique para alterar)' : 'Clique para selecionar a nota' }}
                  </span>
                </div>

                <textarea
                  [(ngModel)]="userReviewText"
                  rows="3"
                  [placeholder]="selectedTrack
                    ? 'Escreva sua resenha sobre a faixa ' + selectedTrack.title + ' (opcional)...'
                    : 'Escreva sua resenha ou pensamentos sobre este disco (opcional)...'"
                  class="w-full bg-[#101417] border border-[#242c34] rounded p-3 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                ></textarea>

                <div class="flex items-center justify-between mt-3">
                  @if (currentActiveReview) {
                    <button
                      type="button"
                      (click)="deleteReview()"
                      [disabled]="savingReview"
                      class="cursor-pointer disabled:cursor-not-allowed text-xs text-red-400 hover:text-red-300 hover:underline"
                    >
                      Excluir minha review {{ selectedTrack ? 'desta m├║sica' : 'do ├ílbum' }}
                    </button>
                  } @else {
                    <span class="text-[11px] text-gray-500">
                      Dica: voc├¬ tamb├®m pode clicar em qualquer m├║sica na lista abaixo para avali├í-la.
                    </span>
                  }

                  <button
                    type="button"
                    (click)="saveReview()"
                    [disabled]="savingReview || userRating === 0"
                    class="cursor-pointer disabled:cursor-not-allowed bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold px-4 py-2 rounded text-xs uppercase tracking-wider transition-colors"
                  >
                    {{ savingReview ? 'Salvando...' : (currentActiveReview ? 'Atualizar Review' : 'Publicar Review') }}
                  </button>
                </div>
              } @else {
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-sm font-semibold text-gray-200">Quer avaliar este ├ílbum ou suas m├║sicas?</h3>
                    <p class="text-xs text-gray-400 mt-0.5">Fa├ºa login para dar sua nota ao disco ou avaliar faixas individuais.</p>
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

        <!-- Se├º├Áes: Faixas e Reviews -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
          
          <!-- Faixas do Disco -->
          <div class="lg:col-span-1">
            <div class="flex items-center justify-between mb-2">
              <h2 class="text-sm font-black text-gray-200 uppercase tracking-widest">
                Faixas ({{ album.tracks.length }})
              </h2>
              @if (selectedTrack) {
                <button
                  type="button"
                  (click)="selectTrack(null)"
                  class="cursor-pointer text-[11px] text-emerald-400 hover:underline font-semibold"
                >
                  Limpar sele├º├úo
                </button>
              }
            </div>
            <p class="text-[11px] text-gray-500 mb-3">
              Clique em uma faixa para fazer um review individual ou ver suas avalia├º├Áes.
            </p>

            @if (album.tracks.length > 0) {
              <div class="bg-[#1b2228] border border-[#2a343d] rounded-lg divide-y divide-[#242c34] overflow-hidden text-xs">
                @for (track of album.tracks; track track.trackNumber) {
                  <button
                    type="button"
                    (click)="toggleTrackSelection(track)"
                    class="cursor-pointer w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors"
                    [ngClass]="{
                      'bg-emerald-500/15 border-l-2 border-l-emerald-400': selectedTrack?.trackNumber === track.trackNumber,
                      'hover:bg-[#222b33]': selectedTrack?.trackNumber !== track.trackNumber
                    }"
                  >
                    <div class="flex items-center gap-3 truncate pr-2">
                      <span
                        class="font-mono text-[11px] w-4 text-right shrink-0"
                        [ngClass]="selectedTrack?.trackNumber === track.trackNumber ? 'text-emerald-400 font-bold' : 'text-gray-500'"
                      >
                        {{ track.trackNumber }}
                      </span>
                      <span
                        class="truncate font-medium"
                        [ngClass]="selectedTrack?.trackNumber === track.trackNumber ? 'text-emerald-300 font-bold' : 'text-gray-300'"
                      >
                        {{ track.title }}
                      </span>
                    </div>

                    <div class="flex items-center gap-2 shrink-0">
                      @if (getMyTrackReview(track.trackNumber); as myTrkRev) {
                        <span
                          class="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded"
                          title="Sua nota para esta m├║sica"
                        >
                          Ôÿà {{ myTrkRev.rating.toFixed(1) }}
                        </span>
                      } @else if (getTrackAverageRating(track.trackNumber) !== null) {
                        <span
                          class="text-[10px] font-semibold bg-[#12161a] text-gray-400 px-1.5 py-0.5 rounded"
                          title="M├®dia da comunidade para esta m├║sica"
                        >
                          Ôÿà {{ getTrackAverageRating(track.trackNumber)!.toFixed(1) }}
                        </span>
                      }
                      <span class="text-gray-500 text-[11px] font-mono">
                        {{ formatDuration(track.durationMs) }}
                      </span>
                    </div>
                  </button>
                }
              </div>
            } @else {
              <p class="text-xs text-gray-500">Tracklist indispon├¡vel.</p>
            }
          </div>

          <!-- Resenhas da Comunidade -->
          <div class="lg:col-span-2">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 class="text-sm font-black text-gray-200 uppercase tracking-widest">
                Resenhas da Comunidade ({{ filteredCommunityReviews.length }})
              </h2>

              <!-- Filtros de Resenhas -->
              <div class="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  (click)="reviewFilter = 'all'"
                  class="cursor-pointer text-[11px] font-bold px-2.5 py-1 rounded transition-colors"
                  [ngClass]="reviewFilter === 'all' ? 'bg-emerald-500 text-black' : 'bg-[#1b2228] text-gray-400 hover:text-white border border-[#2a343d]'"
                >
                  Todas ({{ totalCombinedReviewsCount }})
                </button>
                <button
                  type="button"
                  (click)="reviewFilter = 'album'"
                  class="cursor-pointer text-[11px] font-bold px-2.5 py-1 rounded transition-colors"
                  [ngClass]="reviewFilter === 'album' ? 'bg-emerald-500 text-black' : 'bg-[#1b2228] text-gray-400 hover:text-white border border-[#2a343d]'"
                >
                  ├ülbum ({{ reviewsSummary?.reviews?.length || 0 }})
                </button>
                <button
                  type="button"
                  (click)="reviewFilter = 'tracks'"
                  class="cursor-pointer text-[11px] font-bold px-2.5 py-1 rounded transition-colors"
                  [ngClass]="reviewFilter === 'tracks' ? 'bg-emerald-500 text-black' : 'bg-[#1b2228] text-gray-400 hover:text-white border border-[#2a343d]'"
                >
                  M├║sicas ({{ reviewsSummary?.trackReviews?.length || 0 }})
                </button>
                @if (selectedTrack) {
                  <button
                    type="button"
                    (click)="reviewFilter = 'selectedTrack'"
                    class="cursor-pointer text-[11px] font-bold px-2.5 py-1 rounded transition-colors truncate max-w-[180px]"
                    [ngClass]="reviewFilter === 'selectedTrack' ? 'bg-emerald-500 text-black' : 'bg-[#1b2228] text-emerald-400 hover:text-white border border-emerald-500/40'"
                  >
                    Faixa #{{ selectedTrack.trackNumber }} ({{ getTrackReviewsCount(selectedTrack.trackNumber) }})
                  </button>
                }
              </div>
            </div>

            @if (filteredCommunityReviews.length > 0) {
              <div class="space-y-4">
                @for (rev of filteredCommunityReviews; track rev.id) {
                  <div class="bg-[#1b2228] border border-[#2a343d] rounded-lg p-5">
                    <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div class="flex flex-wrap items-center gap-2">
                        <a
                          [routerLink]="['/profile', rev.username]"
                          class="font-bold text-sm text-gray-100 hover:text-emerald-400 transition-colors"
                        >
                          {{ rev.username }}
                        </a>
                        @if (rev.trackNumber !== null) {
                          <span class="text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            ­ƒÄÁ Faixa #{{ rev.trackNumber }} ÔÇó {{ rev.trackTitle }}
                          </span>
                        } @else {
                          <span class="text-[10px] font-semibold bg-[#12161a] text-gray-400 border border-[#242c34] px-2 py-0.5 rounded-full">
                            ­ƒÆ┐ ├ülbum Completo
                          </span>
                        }
                        <span class="text-[11px] text-gray-500">ÔÇó {{ formatDate(rev.createdAt) }}</span>
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
                @if (reviewFilter === 'selectedTrack' && selectedTrack) {
                  Ainda n├úo h├í resenhas para a faixa "{{ selectedTrack.title }}". Seja o primeiro a avaliar!
                } @else if (reviewFilter === 'tracks') {
                  Ainda n├úo h├í resenhas individuais para m├║sicas deste ├ílbum. Clique em uma faixa ao lado para avaliar!
                } @else {
                  Ainda n├úo h├í resenhas para este ├ílbum. Seja o primeiro a avaliar!
                }
              </div>
            }
          </div>

        </div>

      } @else {
        <div class="text-center py-20 text-gray-400">
          <p>├ülbum n├úo encontrado.</p>
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
  myTrackReviews: ReviewResponse[] = [];

  selectedTrack: AlbumTrackResponse | null = null;
  reviewFilter: 'all' | 'album' | 'tracks' | 'selectedTrack' = 'all';

  loading = true;
  savingReview = false;

  userRating: number = 0;
  userReviewText: string = '';

  get currentActiveReview(): ReviewResponse | null {
    if (this.selectedTrack) {
      return this.getMyTrackReview(this.selectedTrack.trackNumber);
    }
    return this.myReview;
  }

  get totalCombinedReviewsCount(): number {
    const albumCount = this.reviewsSummary?.reviews?.length || 0;
    const trackCount = this.reviewsSummary?.trackReviews?.length || 0;
    return albumCount + trackCount;
  }

  get filteredCommunityReviews(): ReviewResponse[] {
    const albumRevs = this.reviewsSummary?.reviews || [];
    const trackRevs = this.reviewsSummary?.trackReviews || [];

    if (this.reviewFilter === 'album') {
      return albumRevs;
    }
    if (this.reviewFilter === 'tracks') {
      return trackRevs;
    }
    if (this.reviewFilter === 'selectedTrack' && this.selectedTrack) {
      return trackRevs.filter(r => r.trackNumber === this.selectedTrack!.trackNumber);
    }

    return [...albumRevs, ...trackRevs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

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
    this.selectedTrack = null;
    this.reviewFilter = 'all';

    this.catalogService.getAlbum(spotifyId).subscribe({
      next: (data) => {
        this.album = data;
        this.loadReviews(spotifyId);
        if (this.authService.isAuthenticated()) {
          this.loadMyReviews(spotifyId);
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

  loadMyReviews(spotifyId: string): void {
    this.reviewsService.getMyTrackReviewsForAlbum(spotifyId).subscribe({
      next: (trackRevs) => {
        this.myTrackReviews = trackRevs || [];
      },
      error: () => {
        this.myTrackReviews = [];
      }
    });

    this.reviewsService.getMyReviewForAlbum(spotifyId).subscribe({
      next: (rev) => {
        this.myReview = rev;
        this.syncFormWithActiveTarget();
        this.loading = false;
      },
      error: () => {
        this.myReview = null;
        this.syncFormWithActiveTarget();
        this.loading = false;
      }
    });
  }

  toggleTrackSelection(track: AlbumTrackResponse): void {
    if (this.selectedTrack?.trackNumber === track.trackNumber) {
      this.selectTrack(null);
    } else {
      this.selectTrack(track);
    }
  }

  onTrackDropdownChange(trackNum: number): void {
    if (!trackNum || trackNum === 0) {
      this.selectTrack(null);
    } else {
      const found = this.album?.tracks.find(t => t.trackNumber === Number(trackNum)) || null;
      this.selectTrack(found);
    }
  }

  selectTrack(track: AlbumTrackResponse | null): void {
    this.selectedTrack = track;
    if (track && this.reviewFilter === 'selectedTrack') {
      // keep filter on selectedTrack
    } else if (!track && this.reviewFilter === 'selectedTrack') {
      this.reviewFilter = 'all';
    }
    this.syncFormWithActiveTarget();
  }

  private syncFormWithActiveTarget(): void {
    const active = this.currentActiveReview;
    if (active) {
      this.userRating = active.rating;
      this.userReviewText = active.reviewText || '';
    } else {
      this.userRating = 0;
      this.userReviewText = '';
    }
  }

  getMyTrackReview(trackNumber: number): ReviewResponse | null {
    return this.myTrackReviews.find(r => r.trackNumber === trackNumber) || null;
  }

  getTrackReviewsCount(trackNumber: number): number {
    return (this.reviewsSummary?.trackReviews || []).filter(r => r.trackNumber === trackNumber).length;
  }

  getTrackAverageRating(trackNumber: number): number | null {
    const revs = (this.reviewsSummary?.trackReviews || []).filter(r => r.trackNumber === trackNumber);
    if (revs.length === 0) return null;
    const sum = revs.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / revs.length) * 10) / 10;
  }

  onRatingSelected(rating: number): void {
    this.userRating = rating;
  }

  saveReview(): void {
    if (!this.album || this.userRating === 0) return;

    this.savingReview = true;
    this.reviewsService.createOrUpdateReview({
      spotifyId: this.album.externalId,
      trackNumber: this.selectedTrack ? this.selectedTrack.trackNumber : null,
      trackTitle: this.selectedTrack ? this.selectedTrack.title : null,
      rating: this.userRating,
      reviewText: this.userReviewText.trim()
    }).subscribe({
      next: (saved) => {
        if (this.selectedTrack) {
          const idx = this.myTrackReviews.findIndex(r => r.trackNumber === this.selectedTrack!.trackNumber);
          if (idx >= 0) {
            this.myTrackReviews[idx] = saved;
          } else {
            this.myTrackReviews = [...this.myTrackReviews, saved];
          }
        } else {
          this.myReview = saved;
        }
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
    const active = this.currentActiveReview;
    if (!active || !this.album) return;

    this.savingReview = true;
    this.reviewsService.deleteReview(active.id).subscribe({
      next: () => {
        if (this.selectedTrack) {
          this.myTrackReviews = this.myTrackReviews.filter(r => r.id !== active.id);
        } else {
          this.myReview = null;
        }
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
