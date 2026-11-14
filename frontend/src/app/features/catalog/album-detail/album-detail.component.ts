import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AlbumDetailResponse, AlbumTrackResponse } from '../../../core/models/catalog.models';
import { AlbumReviewsSummaryResponse, ReviewResponse } from '../../../core/models/reviews.models';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { ProfileService } from '../../../core/services/profile.service';
import { ReviewsService } from '../../../core/services/reviews.service';
import { ShareCardData, ShareCardModalComponent } from '../../../shared/components/share-card-modal/share-card-modal.component';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-album-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StarRatingComponent, ShareCardModalComponent],
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
              <div class="flex flex-wrap items-center gap-3">
                <span class="text-xs font-bold text-gray-400 uppercase tracking-widest bg-[#1c2228] px-2.5 py-1 rounded">
                  Álbum
                </span>
                @if (album.releaseYear) {
                  <span class="text-xs text-gray-500 font-semibold">{{ album.releaseYear }}</span>
                }
                <a
                  [href]="'https://open.spotify.com/album/' + album.externalId"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-[11px] uppercase tracking-wider px-3 py-1 rounded-full transition-colors shadow"
                  title="Ouvir álbum completo no Spotify"
                >
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  <span>Ouvir no Spotify</span>
                </a>
                <button
                  type="button"
                  (click)="toggleListenLater()"
                  [disabled]="togglingListenLater"
                  class="cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider px-3 py-1 rounded-full transition-colors border shadow"
                  [ngClass]="savedInListenLater
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                    : 'bg-[#1c2228] text-gray-200 border-[#2a343d] hover:border-emerald-500/50 hover:text-emerald-400'"
                  title="Salvar na fila Quero Ouvir"
                >
                  <span>{{ savedInListenLater ? '✓ Na fila Quero Ouvir' : '🔖 Quero Ouvir' }}</span>
                </button>
              </div>

              <h1 class="text-3xl sm:text-4xl font-black text-white mt-2 tracking-tight">
                {{ album.title }}
              </h1>
              <p class="text-lg text-emerald-400 font-medium mt-1">
                <a
                  [routerLink]="['/catalog/artists', getPrimaryArtist(album.artist)]"
                  class="hover:underline inline-flex items-center gap-1"
                  title="Ver página do artista e notas no Muly"
                >
                  <span>{{ album.artist }}</span>
                  <span class="text-xs text-gray-500">→</span>
                </a>
              </p>

              <!-- Média de Avaliações -->
              <div class="flex flex-wrap items-center gap-4 mt-4">
                <div class="flex items-center gap-4 py-3 px-4 bg-[#1b2228] rounded-lg border border-[#2a343d] w-fit">
                  <div>
                    <span class="text-[10px] uppercase tracking-wider font-bold text-gray-400 block">Média do Álbum</span>
                    <span class="text-2xl font-black text-white">
                      {{ reviewsSummary?.averageRating ? (reviewsSummary?.averageRating?.toFixed(1)) : '—' }}
                    </span>
                    <span class="text-xs text-gray-500"> / 5.0</span>
                  </div>
                  <div class="h-8 w-px bg-[#2a343d]"></div>
                  <div>
                    <app-star-rating [rating]="reviewsSummary?.averageRating || 0" [readonly]="true" [showValue]="false" />
                    <span class="text-[11px] text-gray-400 block">
                      {{ reviewsSummary?.totalReviews || 0 }} {{ reviewsSummary?.totalReviews === 1 ? 'avaliação' : 'avaliações' }}
                    </span>
                  </div>
                </div>

                @if (selectedTrack) {
                  <div class="flex items-center gap-4 py-3 px-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30 w-fit">
                    <div>
                      <span class="text-[10px] uppercase tracking-wider font-bold text-emerald-400 block truncate max-w-[180px]">
                        Faixa #{{ selectedTrack.trackNumber }} • {{ selectedTrack.title }}
                      </span>
                      <span class="text-2xl font-black text-white">
                        {{ getTrackAverageRating(selectedTrack.trackNumber) !== null ? getTrackAverageRating(selectedTrack.trackNumber)!.toFixed(1) : '—' }}
                      </span>
                      <span class="text-xs text-gray-400"> / 5.0</span>
                    </div>
                    <div class="h-8 w-px bg-emerald-500/20"></div>
                    <div>
                      <app-star-rating [rating]="getTrackAverageRating(selectedTrack.trackNumber) || 0" [readonly]="true" [showValue]="false" />
                      <span class="text-[11px] text-emerald-300 block">
                        {{ getTrackReviewsCount(selectedTrack.trackNumber) }} {{ getTrackReviewsCount(selectedTrack.trackNumber) === 1 ? 'avaliação da faixa' : 'avaliações da faixa' }}
                      </span>
                    </div>
                  </div>
                }
              </div>

              <!-- Amigos que já ouviram -->
              @if (reviewsSummary?.friendsReviews && reviewsSummary!.friendsReviews!.length > 0) {
                <div class="mt-4 bg-[#182026] border border-emerald-500/25 rounded-lg p-3.5">
                  <span class="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-2">
                    👥 Amigos que já ouviram ({{ reviewsSummary!.friendsReviews!.length }})
                  </span>
                  <div class="flex flex-wrap items-center gap-2">
                    @for (friendRev of reviewsSummary!.friendsReviews!; track friendRev.id) {
                      <button
                        type="button"
                        (click)="focusReview(friendRev.id)"
                        class="cursor-pointer inline-flex items-center gap-2 bg-[#12161a] hover:bg-[#222b33] border border-[#2a343d] hover:border-emerald-500/40 px-2.5 py-1.5 rounded-full transition-colors text-xs"
                        [title]="friendRev.reviewText || ('Ver avaliação de @' + friendRev.username)"
                      >
                        <span class="w-5 h-5 rounded-full bg-[#1b2228] border border-emerald-500/50 overflow-hidden flex items-center justify-center text-[9px] font-black text-white uppercase shrink-0">
                          @if (friendRev.userAvatarUrl) {
                            <img [src]="friendRev.userAvatarUrl" [alt]="friendRev.username" class="w-full h-full object-cover" />
                          } @else {
                            {{ (friendRev.userDisplayName || friendRev.username).substring(0, 2) }}
                          }
                        </span>
                        <span class="font-bold text-gray-200">&#64;{{ friendRev.username }}</span>
                        @if (friendRev.trackNumber !== null) {
                          <span class="text-[10px] text-gray-400">(#{{ friendRev.trackNumber }})</span>
                        }
                        <span class="font-black text-emerald-400">★ {{ friendRev.rating.toFixed(1) }}</span>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Caixa de Avaliação do Usuário -->
            <div class="mt-6 bg-[#161b20] border border-[#2a343d] rounded-lg p-5">
              @if (authService.isAuthenticated()) {
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#242c34]">
                  <div>
                    <div class="flex items-center gap-2">
                      <span
                        class="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                        [ngClass]="selectedTrack ? 'bg-emerald-500 text-black' : 'bg-[#242c34] text-emerald-400'"
                      >
                        {{ selectedTrack ? 'Avaliando Música' : 'Avaliando Álbum Completo' }}
                      </span>
                      @if (selectedTrack) {
                        <button
                          type="button"
                          (click)="selectTrack(null)"
                          class="cursor-pointer text-[11px] text-gray-400 hover:text-white underline"
                        >
                          Voltar para o álbum
                        </button>
                      }
                    </div>
                    <h3 class="text-sm font-bold text-white mt-1.5">
                      @if (selectedTrack) {
                        #{{ selectedTrack.trackNumber }} - {{ selectedTrack.title }}
                      } @else {
                        {{ album.title }} (Álbum Completo)
                      }
                    </h3>
                  </div>

                  <!-- Seletor rápido de faixa ou álbum -->
                  @if (album.tracks.length > 0) {
                    <div class="flex items-center gap-2">
                      <label class="text-[11px] text-gray-400 font-semibold whitespace-nowrap">Escolher:</label>
                      <select
                        [ngModel]="selectedTrack?.trackNumber || 0"
                        (ngModelChange)="onTrackDropdownChange($event)"
                        class="bg-[#101417] border border-[#2a343d] rounded px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500 max-w-[220px]"
                      >
                        <option [ngValue]="0">💿 Álbum Completo</option>
                        @for (track of album.tracks; track track.trackNumber) {
                          <option [ngValue]="track.trackNumber">
                            🎵 {{ track.trackNumber }}. {{ track.title }} {{ getMyTrackReview(track.trackNumber) ? ' (★ ' + getMyTrackReview(track.trackNumber)!.rating.toFixed(1) + ')' : '' }}
                          </option>
                        }
                      </select>
                    </div>
                  }
                </div>

                <div class="flex flex-wrap items-center gap-4 mb-3">
                  <app-star-rating
                    [rating]="userRating"
                    [readonly]="false"
                    (ratingChange)="onRatingSelected($event)"
                  />
                  <span class="text-xs text-gray-400">
                    {{ currentActiveReview ? 'Sua nota salva (passe na metade esquerda da estrela para ½ ★)' : 'Clique na metade esquerda da estrela para ½ ★ ou direita para ★ inteira' }}
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
                      Excluir minha review {{ selectedTrack ? 'desta música' : 'do álbum' }}
                    </button>
                  } @else {
                    <span class="text-[11px] text-gray-500">
                      Dica: você também pode clicar em qualquer música na lista abaixo para avaliá-la.
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
                    <h3 class="text-sm font-semibold text-gray-200">Quer avaliar este álbum ou suas músicas?</h3>
                    <p class="text-xs text-gray-400 mt-0.5">Faça login para dar sua nota ao disco ou avaliar faixas individuais.</p>
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
                  Limpar seleção
                </button>
              }
            </div>
            <p class="text-[11px] text-gray-500 mb-3">
              Clique em uma faixa para fazer um review individual ou ver suas avaliações.
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
                          title="Sua nota para esta música"
                        >
                          ★ {{ myTrkRev.rating.toFixed(1) }}
                        </span>
                      } @else if (getTrackAverageRating(track.trackNumber) !== null) {
                        <span
                          class="text-[10px] font-semibold bg-[#12161a] text-gray-400 px-1.5 py-0.5 rounded"
                          title="Média da comunidade para esta música"
                        >
                          ★ {{ getTrackAverageRating(track.trackNumber)!.toFixed(1) }}
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
              <p class="text-xs text-gray-500">Tracklist indisponível.</p>
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
                  Álbum ({{ reviewsSummary?.reviews?.length || 0 }})
                </button>
                <button
                  type="button"
                  (click)="reviewFilter = 'tracks'"
                  class="cursor-pointer text-[11px] font-bold px-2.5 py-1 rounded transition-colors"
                  [ngClass]="reviewFilter === 'tracks' ? 'bg-emerald-500 text-black' : 'bg-[#1b2228] text-gray-400 hover:text-white border border-[#2a343d]'"
                >
                  Músicas ({{ reviewsSummary?.trackReviews?.length || 0 }})
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
                  <div
                    [id]="'review-' + rev.id"
                    (click)="openReview(rev)"
                    class="cursor-pointer group/rev bg-[#1b2228] border hover:border-emerald-500/50 hover:bg-[#1e262d] rounded-lg p-5 transition-all"
                    [ngClass]="highlightedReviewId === rev.id ? 'border-emerald-400 ring-2 ring-emerald-400/50 bg-emerald-500/5' : 'border-[#2a343d]'"
                  >
                    @if (highlightedReviewId === rev.id) {
                      <div class="mb-2 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                        <span>🔗 Review compartilhada</span>
                      </div>
                    }
                    <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div class="flex flex-wrap items-center gap-2">
                        <a
                          [routerLink]="['/profile', rev.username]"
                          (click)="$event.stopPropagation()"
                          class="inline-flex items-center gap-2 font-bold text-sm text-gray-100 hover:text-emerald-400 transition-colors"
                        >
                          <span class="w-6 h-6 rounded-full bg-[#12161a] border border-emerald-500/60 overflow-hidden flex items-center justify-center text-[10px] font-black text-white uppercase shrink-0">
                            @if (rev.userAvatarUrl) {
                              <img [src]="rev.userAvatarUrl" [alt]="rev.username" class="w-full h-full object-cover" />
                            } @else {
                              {{ (rev.userDisplayName || rev.username).substring(0, 2) }}
                            }
                          </span>
                          <span>{{ rev.userDisplayName || rev.username }}</span>
                        </a>
                        @if (rev.trackNumber !== null) {
                          <span class="text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            🎵 Faixa #{{ rev.trackNumber }} • {{ rev.trackTitle }}
                          </span>
                        } @else {
                          <span class="text-[10px] font-semibold bg-[#12161a] text-gray-400 border border-[#242c34] px-2 py-0.5 rounded-full">
                            💿 Álbum Completo
                          </span>
                        }
                        <span class="text-[11px] text-gray-500">• {{ formatDate(rev.createdAt) }}</span>
                      </div>
                      <app-star-rating [rating]="rev.rating" [readonly]="true" />
                    </div>

                    @if (rev.reviewText) {
                      <p class="text-xs text-gray-300 leading-relaxed mt-2 whitespace-pre-wrap">
                        {{ rev.reviewText }}
                      </p>
                    }

                    <!-- Barra de Ações da Review: Curtir Grande, Comentar (vai p/ página da review) e Compartilhar -->
                    <div class="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-[#242c34]/80">
                      <div class="flex items-center gap-2.5">
                        <button
                          type="button"
                          (click)="toggleLikeReview(rev, $event)"
                          class="cursor-pointer min-h-[42px] px-4 py-2 rounded-full text-sm font-black inline-flex items-center gap-2 border transition-all active:scale-95"
                          [ngClass]="rev.likedByMe
                            ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-sm'
                            : 'bg-[#14181c] border-[#2a343d] text-gray-300 hover:border-rose-500/40 hover:text-rose-400'"
                        >
                          <span class="text-base leading-none">{{ rev.likedByMe ? '♥' : '♡' }}</span>
                          <span>{{ rev.likesCount || 0 }}</span>
                        </button>

                        <button
                          type="button"
                          (click)="openReviewComments(rev, $event)"
                          class="cursor-pointer min-h-[42px] px-4 py-2 rounded-full text-sm font-bold inline-flex items-center gap-2 bg-[#14181c] border border-[#2a343d] text-gray-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-all active:scale-95"
                        >
                          <span class="text-sm leading-none">💬</span>
                          <span>{{ rev.commentsCount || (rev.comments?.length || 0) }}</span>
                        </button>
                      </div>

                      <div class="flex items-center gap-3">
                        <button
                          type="button"
                          (click)="shareReview(rev, $event)"
                          class="cursor-pointer inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-emerald-400 transition-colors"
                          title="Copiar link de compartilhamento desta review"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          <span>{{ copiedReviewId === rev.id ? 'Copiado! ✓' : 'Compartilhar' }}</span>
                        </button>
                        <span class="text-xs font-bold text-emerald-400 group-hover/rev:underline">
                          Abrir →
                        </span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="text-center py-12 bg-[#1b2228] border border-[#2a343d] rounded-lg text-gray-500 text-xs">
                @if (reviewFilter === 'selectedTrack' && selectedTrack) {
                  Ainda não há resenhas para a faixa "{{ selectedTrack.title }}". Seja o primeiro a avaliar!
                } @else if (reviewFilter === 'tracks') {
                  Ainda não há resenhas individuais para músicas deste álbum. Clique em uma faixa ao lado para avaliar!
                } @else {
                  Ainda não há resenhas para este álbum. Seja o primeiro a avaliar!
                }
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

      <app-share-card-modal
        [open]="shareModalOpen"
        [data]="shareCardData"
        (closed)="shareModalOpen = false"
      />
    </div>
  `
})
export class AlbumDetailComponent implements OnInit {
  authService = inject(AuthService);
  private catalogService = inject(CatalogService);
  private profileService = inject(ProfileService);
  private reviewsService = inject(ReviewsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private titleService = inject(Title);
  private metaService = inject(Meta);

  album: AlbumDetailResponse | null = null;
  reviewsSummary: AlbumReviewsSummaryResponse | null = null;
  myReview: ReviewResponse | null = null;
  myTrackReviews: ReviewResponse[] = [];
  savedInListenLater = false;
  togglingListenLater = false;

  selectedTrack: AlbumTrackResponse | null = null;
  reviewFilter: 'all' | 'album' | 'tracks' | 'selectedTrack' = 'all';

  highlightedReviewId: string | null = null;
  copiedReviewId: string | null = null;
  shareModalOpen = false;
  shareCardData: ShareCardData | null = null;

  openCommentsMap: Record<string, boolean> = {};
  commentInputs: Record<string, string> = {};

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
    this.route.queryParamMap.subscribe(qParams => {
      this.highlightedReviewId = qParams.get('review');
    });

    this.route.paramMap.subscribe(params => {
      const spotifyId = params.get('spotifyId');
      if (spotifyId) {
        this.loadAlbumData(spotifyId);
      }
    });
  }

  openReview(rev: ReviewResponse): void {
    this.router.navigate(['/reviews', rev.id], {
      queryParams: { album: rev.albumExternalId },
      state: { review: rev }
    });
  }

  openReviewComments(rev: ReviewResponse, event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/reviews', rev.id], {
      queryParams: { album: rev.albumExternalId, focus: 'comment' },
      state: { review: rev }
    });
  }

  focusReview(reviewId: string): void {
    const all = [
      ...(this.reviewsSummary?.reviews || []),
      ...(this.reviewsSummary?.trackReviews || [])
    ];
    const found = all.find(r => r.id === reviewId);
    if (found) {
      this.openReview(found);
      return;
    }
    this.reviewFilter = 'all';
    this.highlightedReviewId = reviewId;
    setTimeout(() => {
      const el = document.getElementById('review-' + reviewId);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }

  toggleLikeReview(rev: ReviewResponse, event?: Event): void {
    event?.stopPropagation();
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.reviewsService.toggleLike(rev.id).subscribe({
      next: (updated) => {
        rev.likedByMe = updated.likedByMe;
        rev.likesCount = updated.likesCount;
      }
    });
  }

  shareReview(rev: ReviewResponse, event?: Event): void {
    event?.stopPropagation();
    if (!this.album) return;
    const url = `${window.location.origin}/reviews/${rev.id}`;
    navigator.clipboard?.writeText(url);
    this.copiedReviewId = rev.id;

    this.shareCardData = {
      type: 'review',
      url,
      title: this.album.title,
      subtitle: this.album.artist,
      username: rev.username,
      rating: rev.rating,
      reviewText: rev.reviewText,
      trackBadge: rev.trackNumber !== null ? `Faixa #${rev.trackNumber} • ${rev.trackTitle}` : null,
      coverUrl: this.album.coverUrl
    };
    this.shareModalOpen = true;

    setTimeout(() => {
      if (this.copiedReviewId === rev.id) {
        this.copiedReviewId = null;
      }
    }, 2500);
  }

  private updateMetaTags(): void {
    if (!this.album) return;
    let title = `${this.album.title} — ${this.album.artist} | Muly`;
    let desc = `Avaliações e faixas de ${this.album.title} (${this.album.artist}) no Muly.`;

    if (this.highlightedReviewId && this.reviewsSummary) {
      const all = [...(this.reviewsSummary.reviews || []), ...(this.reviewsSummary.trackReviews || [])];
      const rev = all.find(r => r.id === this.highlightedReviewId);
      if (rev) {
        title = `★ ${rev.rating.toFixed(1)}/5 — Review de @${rev.username} para ${this.album.title} | Muly`;
        if (rev.reviewText) {
          desc = `"${rev.reviewText}" — @${rev.username} no Muly.`;
        }
      }
    }

    this.titleService.setTitle(title);
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: desc });
    if (this.album.coverUrl) {
      this.metaService.updateTag({ property: 'og:image', content: this.album.coverUrl });
    }
  }

  loadAlbumData(spotifyId: string): void {
    this.loading = true;
    this.selectedTrack = null;
    this.reviewFilter = 'all';
    this.savedInListenLater = false;

    this.catalogService.getAlbum(spotifyId).subscribe({
      next: (data) => {
        this.album = data;
        this.loadReviews(spotifyId);
        if (this.authService.isAuthenticated()) {
          this.loadMyReviews(spotifyId);
          this.profileService.getListenLaterStatus(spotifyId).subscribe({
            next: (res) => {
              this.savedInListenLater = !!res?.saved;
            },
            error: () => {
              this.savedInListenLater = false;
            }
          });
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

  getPrimaryArtist(artist: string): string {
    if (!artist) return '';
    return artist.split(',')[0].trim();
  }

  toggleListenLater(): void {
    if (!this.album) return;
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.togglingListenLater = true;
    this.profileService.toggleListenLater(this.album.externalId).subscribe({
      next: (res) => {
        this.savedInListenLater = !!res?.saved;
        this.togglingListenLater = false;
      },
      error: () => {
        this.togglingListenLater = false;
      }
    });
  }

  loadReviews(spotifyId: string): void {
    this.reviewsService.getReviewsByAlbum(spotifyId).subscribe({
      next: (summary) => {
        this.reviewsSummary = summary;
        this.updateMetaTags();
        if (this.highlightedReviewId) {
          this.reviewFilter = 'all';
          setTimeout(() => {
            const el = document.getElementById('review-' + this.highlightedReviewId);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 150);
        }
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
