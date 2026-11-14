import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AlbumResponse, RankedAlbumResponse } from '../../core/models/catalog.models';
import { AlbumListSummaryResponse } from '../../core/models/lists.models';
import { ReviewResponse } from '../../core/models/reviews.models';
import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '../../core/services/catalog.service';
import { ListsService } from '../../core/services/lists.service';
import { ReviewsService } from '../../core/services/reviews.service';
import { ServerStatusService } from '../../core/services/server-status.service';
import { formatRating } from '../../core/utils/rating.utils';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';

const FALLBACK_FEATURED_ALBUMS: AlbumResponse[] = [
  {
    id: 'fallback-1',
    externalId: '6dVIqQ8qmQ5GBnJ9shOYGE',
    title: 'OK Computer',
    artist: 'Radiohead',
    releaseYear: 1997,
    coverUrl: 'https://i.scdn.co/image/ab67616d0000b273c8b444df094279e70d0ed856'
  },
  {
    id: 'fallback-2',
    externalId: '5vkqYmiPBYLaalcmjujWxK',
    title: 'In Rainbows',
    artist: 'Radiohead',
    releaseYear: 2007,
    coverUrl: 'https://i.scdn.co/image/ab67616d0000b273de3c04b5fc750b68899b20a9'
  },
  {
    id: 'fallback-3',
    externalId: '6GjwtEZcfenmOf6l18N7T7',
    title: 'Kid A',
    artist: 'Radiohead',
    releaseYear: 2000,
    coverUrl: 'https://i.scdn.co/image/ab67616d0000b2736c7112082b63beefffe40151'
  },
  {
    id: 'fallback-4',
    externalId: '35UJLpClj5EDrhpNIi4DFg',
    title: 'The Bends',
    artist: 'Radiohead',
    releaseYear: 1995,
    coverUrl: 'https://i.scdn.co/image/ab67616d0000b2739293c743fa542094336c5e12'
  },
  {
    id: 'fallback-5',
    externalId: '6vuykQgDLUCiZ7YggIpLM9',
    title: 'A Moon Shaped Pool',
    artist: 'Radiohead',
    releaseYear: 2016,
    coverUrl: 'https://i.scdn.co/image/ab67616d0000b27345643f5cf119cbc9d2811c22'
  }
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StarRatingComponent],
  template: `
    <div>
      <!-- Hero Section -->
      <section class="py-8 sm:py-12 px-4 text-center border-b border-[#242c34] bg-gradient-to-b from-[#181e24] to-[#14181c]">
        <div class="max-w-3xl mx-auto">
          <span class="inline-block text-[10px] sm:text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full mb-3">
            A rede social para quem ama música
          </span>
          <h1 class="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Catalogue o que você ouve. Compartilhe o que você sente.
          </h1>
          <p class="text-xs sm:text-sm text-gray-400 mt-2.5 leading-relaxed max-w-xl mx-auto">
            Registre suas audições com notas detalhadas até 5 estrelas, monte listas temáticas e acompanhe o que seus amigos andam ouvindo.
          </p>

          <!-- Input de Busca Rápida com Autocomplete em Tempo Real -->
          <div #searchContainer class="mt-6 max-w-md mx-auto relative text-left">
            <form (ngSubmit)="search()" class="flex gap-2">
              <input
                type="text"
                name="searchQuery"
                [(ngModel)]="searchQuery"
                (focus)="onSearchFocus()"
                (input)="onSearchInput()"
                autocomplete="off"
                placeholder="Buscar artista, banda ou álbum..."
                class="flex-1 bg-[#101417] border border-[#2a343d] rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500 shadow-inner"
              />
              <button
                type="submit"
                class="cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-5 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-md"
              >
                Buscar
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

          @if (!authService.isAuthenticated()) {
            <div class="mt-5 flex items-center justify-center gap-4 text-xs font-semibold">
              <a routerLink="/register" class="text-emerald-400 hover:underline">
                Crie sua conta grátis →
              </a>
              <span class="text-gray-600">•</span>
              <a routerLink="/login" class="text-gray-400 hover:text-white">
                Já é membro? Entrar
              </a>
            </div>
          }
        </div>
      </section>

      <!-- Layout Editorial estilo Letterboxd: Reviews à Esquerda + Álbuns & Listas da Semana à Direita -->
      <section class="max-w-6xl mx-auto px-4 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          <!-- Coluna Esquerda: Avaliações da Semana / Feed Editorial -->
          <div class="lg:col-span-8 min-w-0">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#242c34]">
              <h2 class="text-xs font-black uppercase tracking-widest text-gray-300 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Avaliações da Semana</span>
              </h2>

              <div class="inline-flex items-center bg-[#181e24] border border-[#2a343d] rounded-lg p-0.5 self-start sm:self-auto">
                @if (authService.isAuthenticated()) {
                  <button
                    type="button"
                    (click)="selectFeedTab('following')"
                    class="cursor-pointer text-[11px] font-bold px-3 py-1 rounded-md transition-colors"
                    [ngClass]="feedTab === 'following' ? 'bg-emerald-500 text-black shadow' : 'text-gray-400 hover:text-white'"
                  >
                    👥 Seguindo
                  </button>
                }
                <button
                  type="button"
                  (click)="selectFeedTab('trending')"
                  class="cursor-pointer text-[11px] font-bold px-3 py-1 rounded-md transition-colors"
                  [ngClass]="feedTab === 'trending' ? 'bg-emerald-500 text-black shadow' : 'text-gray-400 hover:text-white'"
                >
                  🔥 Em Alta
                </button>
                <button
                  type="button"
                  (click)="selectFeedTab('recent')"
                  class="cursor-pointer text-[11px] font-bold px-3 py-1 rounded-md transition-colors"
                  [ngClass]="feedTab === 'recent' ? 'bg-emerald-500 text-black shadow' : 'text-gray-400 hover:text-white'"
                >
                  🕒 Recentes
                </button>
              </div>
            </div>

            @if (loadingFeed) {
              @if (serverStatus.isWakingUp()) {
                <div class="mt-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                  </div>
                  <div>
                    <p class="text-xs font-bold text-emerald-300">Sincronizando feed da comunidade...</p>
                    <p class="text-[11px] text-gray-400">
                      Estabelecendo conexão com o servidor. As resenhas aparecerão automaticamente em instantes.
                    </p>
                  </div>
                </div>
              }
              <div class="divide-y divide-[#242c34]">
                @for (s of [1, 2, 3, 4, 5]; track s) {
                  <div class="py-5 flex gap-4">
                    <div class="w-16 h-16 sm:w-20 sm:h-20 rounded skeleton-shimmer shrink-0"></div>
                    <div class="flex-1 space-y-2.5">
                      <div class="h-4 w-1/2 rounded skeleton-shimmer"></div>
                      <div class="h-3 w-1/3 rounded skeleton-shimmer"></div>
                      <div class="h-3 w-full rounded skeleton-shimmer"></div>
                    </div>
                  </div>
                }
              </div>
            } @else if (feedReviews.length > 0) {
              <div class="divide-y divide-[#242c34]">
                @for (rev of visibleFeedReviews; track rev.id) {
                  <article
                    (click)="openReview(rev)"
                    class="cursor-pointer group/row py-5 flex gap-4 sm:gap-5 items-start hover:bg-[#181e24]/40 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <!-- Capa do Álbum à Esquerda -->
                    <a
                      [routerLink]="['/catalog/albums', rev.albumExternalId]"
                      (click)="$event.stopPropagation()"
                      class="w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-[#12161a] border border-[#2a343d] shrink-0 shadow-md"
                    >
                      @if (rev.albumCoverUrl) {
                        <img [src]="rev.albumCoverUrl" [alt]="rev.albumTitle" class="w-full h-full object-cover group-hover/row:scale-105 transition-transform duration-300" loading="lazy" />
                      } @else {
                        <div class="w-full h-full flex items-center justify-center text-gray-600">💿</div>
                      }
                    </a>

                    <!-- Conteúdo Editorial da Review -->
                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <h3 class="text-base sm:text-lg font-black text-white group-hover/row:text-emerald-400 transition-colors leading-snug">
                          {{ rev.albumTitle }}
                        </h3>
                        @if (rev.albumReleaseYear) {
                          <span class="text-xs sm:text-sm text-gray-500 font-medium">{{ rev.albumReleaseYear }}</span>
                        }
                        @if (rev.trackNumber !== null) {
                          <span class="text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            🎵 Faixa #{{ rev.trackNumber }} • {{ rev.trackTitle }}
                          </span>
                        }
                      </div>

                      <!-- Autor + Estrelas -->
                      <div class="mt-1.5 flex flex-wrap items-center gap-2.5">
                        <a
                          [routerLink]="['/profile', rev.username]"
                          (click)="$event.stopPropagation()"
                          class="inline-flex items-center gap-1.5 group/author"
                        >
                          <span class="w-5 h-5 rounded-full bg-[#12161a] border border-emerald-500/50 overflow-hidden flex items-center justify-center text-[9px] font-black text-white uppercase shrink-0">
                            @if (rev.userAvatarUrl) {
                              <img [src]="rev.userAvatarUrl" [alt]="rev.username" class="w-full h-full object-cover" />
                            } @else {
                              {{ (rev.userDisplayName || rev.username).substring(0, 2) }}
                            }
                          </span>
                          <span class="text-xs font-bold text-gray-300 group-hover/author:text-emerald-400 transition-colors">
                            {{ rev.userDisplayName || rev.username }}
                          </span>
                        </a>

                        <app-star-rating [rating]="rev.rating" [readonly]="true" />
                      </div>

                      <!-- Texto da Review -->
                      @if (rev.reviewText) {
                        <p class="text-xs sm:text-sm text-gray-300 leading-relaxed mt-2.5 line-clamp-3 whitespace-pre-wrap">
                          {{ rev.reviewText }}
                        </p>
                      }

                      <!-- Barra Discreta de Likes / Comentários / Data -->
                      <div class="mt-3 flex items-center justify-between gap-3 text-xs text-gray-500">
                        <div class="flex items-center gap-4">
                          <button
                            type="button"
                            (click)="toggleLikeReview(rev, $event)"
                            class="cursor-pointer inline-flex items-center gap-1.5 font-bold transition-colors"
                            [ngClass]="rev.likedByMe ? 'text-rose-400' : 'text-gray-400 hover:text-rose-400'"
                            title="Curtir avaliação"
                          >
                            <span class="text-sm leading-none">{{ rev.likedByMe ? '♥' : '♡' }}</span>
                            <span>{{ rev.likesCount || 0 }}</span>
                            <span class="font-normal text-[11px] hidden sm:inline">curtidas</span>
                          </button>

                          <button
                            type="button"
                            (click)="openReviewComments(rev, $event)"
                            class="cursor-pointer inline-flex items-center gap-1.5 font-bold text-gray-400 hover:text-emerald-400 transition-colors"
                            title="Comentários"
                          >
                            <span>💬</span>
                            <span>{{ rev.commentsCount || (rev.comments?.length || 0) }}</span>
                          </button>

                          <span>• {{ formatDate(rev.createdAt) }}</span>
                        </div>

                        <span class="text-[11px] font-bold text-emerald-400 opacity-0 group-hover/row:opacity-100 transition-opacity">
                          Abrir →
                        </span>
                      </div>
                    </div>
                  </article>
                }
              </div>

              @if (feedReviews.length > visibleReviewsLimit) {
                <div class="pt-4 text-center">
                  <button
                    type="button"
                    (click)="visibleReviewsLimit = visibleReviewsLimit + 8"
                    class="cursor-pointer text-xs font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 bg-[#181e24] border border-[#2a343d] hover:border-emerald-500/40 px-5 py-2.5 rounded-lg transition-colors"
                  >
                    Carregar mais avaliações
                  </button>
                </div>
              }
            } @else {
              <div class="mt-6 p-10 bg-[#1b2228] border border-dashed border-[#2a343d] rounded-xl text-center">
                @if (feedTab === 'following') {
                  <p class="text-sm font-bold text-gray-200">Seu feed de amigos está vazio por enquanto</p>
                  <p class="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                    Explore a aba <strong class="text-emerald-400">Em Alta</strong>, visite o perfil de outros amantes de música e clique em <strong class="text-emerald-400">+ Seguir</strong> para ver as avaliações deles aqui!
                  </p>
                  <button
                    type="button"
                    (click)="selectFeedTab('trending')"
                    class="cursor-pointer mt-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg transition-colors"
                  >
                    Explorar Comunidade
                  </button>
                } @else if (feedError) {
                  <p class="text-sm font-bold text-gray-200">Não foi possível carregar o feed no momento</p>
                  <p class="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                    A conexão com o servidor está levando mais tempo que o normal. Tente atualizar novamente.
                  </p>
                  <button
                    type="button"
                    (click)="loadFeed()"
                    class="cursor-pointer mt-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg transition-colors"
                  >
                    Tentar novamente
                  </button>
                } @else {
                  <p class="text-xs text-gray-400">
                    Ainda não há avaliações publicadas. Busque um álbum acima e seja o primeiro a avaliar!
                  </p>
                }
              </div>
            }
          </div>

          <!-- Coluna Direita (Sidebar): Álbuns da Semana + Listas da Semana -->
          <aside class="lg:col-span-4 space-y-8">

            <!-- Bloco 1: Álbuns da Semana -->
            <div>
              <div class="flex items-center justify-between pb-2.5 border-b border-[#242c34] mb-4">
                <h2 class="text-xs font-black uppercase tracking-widest text-gray-300">
                  Álbuns da Semana
                </h2>
                <button
                  type="button"
                  (click)="scrollToTop50()"
                  class="cursor-pointer text-[11px] font-bold uppercase tracking-wider text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  Top 50 ↓
                </button>
              </div>

              <div class="grid grid-cols-4 gap-2">
                @for (album of weeklyAlbums; track album.externalId) {
                  <a
                    [routerLink]="['/catalog/albums', album.externalId]"
                    class="group relative aspect-square rounded-md overflow-hidden bg-[#12161a] border border-[#2a343d] hover:border-emerald-400 transition-all shadow"
                    [title]="album.title + ' — ' + album.artist"
                  >
                    @if (album.coverUrl) {
                      <img [src]="album.coverUrl" [alt]="album.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    } @else {
                      <div class="w-full h-full flex items-center justify-center text-gray-600 text-xs">💿</div>
                    }
                    <div class="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 bg-black/75 p-1.5 flex flex-col justify-end">
                      <p class="text-[10px] font-bold text-white leading-tight line-clamp-2">{{ album.title }}</p>
                    </div>
                  </a>
                }
              </div>
            </div>

            <!-- Bloco 2: Listas da Semana (estilo Popular Lists do Letterboxd) -->
            <div>
              <div class="flex items-center justify-between pb-2.5 border-b border-[#242c34] mb-4">
                <h2 class="text-xs font-black uppercase tracking-widest text-gray-300">
                  Listas da Semana
                </h2>
                <a
                  routerLink="/lists"
                  class="text-[11px] font-bold uppercase tracking-wider text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  Mais →
                </a>
              </div>

              @if (loadingLists) {
                <div class="space-y-5">
                  @for (s of [1, 2, 3]; track s) {
                    <div class="space-y-2">
                      <div class="h-20 w-full rounded-md skeleton-shimmer"></div>
                      <div class="h-3.5 w-2/3 rounded skeleton-shimmer"></div>
                      <div class="h-2.5 w-1/2 rounded skeleton-shimmer"></div>
                    </div>
                  }
                </div>
              } @else if (popularLists.length > 0) {
                <div class="space-y-5">
                  @for (lst of popularLists; track lst.id) {
                    <a
                      [routerLink]="['/lists', lst.id]"
                      class="group block"
                    >
                      <!-- Tira horizontal de capas coladas (Letterboxd style) -->
                      <div class="grid grid-cols-4 h-20 rounded-md overflow-hidden border border-[#2a343d] group-hover:border-emerald-500/50 transition-colors bg-[#12161a] shadow">
                        @for (slot of [0, 1, 2, 3]; track slot) {
                          <div class="h-full overflow-hidden border-r border-[#14181c] last:border-r-0 bg-[#181e24]">
                            @if (lst.previewCovers[slot]) {
                              <img [src]="lst.previewCovers[slot]" [alt]="lst.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                            } @else {
                              <div class="w-full h-full flex items-center justify-center text-gray-700 text-xs">♪</div>
                            }
                          </div>
                        }
                      </div>

                      <h3 class="text-sm font-black text-white group-hover:text-emerald-400 transition-colors mt-2 truncate">
                        {{ lst.title }}
                      </h3>

                      <div class="flex items-center gap-2.5 mt-1 text-[11px] text-gray-400">
                        <span class="inline-flex items-center gap-1.5 min-w-0">
                          <span class="w-4 h-4 rounded-full bg-[#12161a] border border-emerald-500/50 overflow-hidden flex items-center justify-center text-[8px] font-black text-white uppercase shrink-0">
                            @if (lst.userAvatarUrl) {
                              <img [src]="lst.userAvatarUrl" [alt]="lst.username" class="w-full h-full object-cover" />
                            } @else {
                              {{ (lst.userDisplayName || lst.username).substring(0, 2) }}
                            }
                          </span>
                          <span class="font-semibold text-gray-300 truncate">{{ lst.userDisplayName || lst.username }}</span>
                        </span>
                        <span class="text-gray-500">{{ lst.albumCount }} {{ lst.albumCount === 1 ? 'álbum' : 'álbuns' }}</span>
                        <span><span class="text-rose-400">♥</span> {{ lst.likesCount }}</span>
                        <span>💬 {{ lst.commentsCount }}</span>
                      </div>
                    </a>
                  }
                </div>
              } @else {
                <div class="p-6 border border-dashed border-[#2a343d] rounded-lg text-center text-xs text-gray-500">
                  Ainda não há listas criadas.
                  <a routerLink="/lists/new" class="block mt-2 text-emerald-400 font-bold hover:underline">
                    + Criar primeira lista
                  </a>
                </div>
              }
            </div>

          </aside>
        </div>
      </section>

      <!-- Seção: Top 50 Álbuns da Comunidade na Home -->
      <section id="top-50-comunidade" class="border-t border-[#242c34] bg-[#12161a]/60">
        <div class="max-w-6xl mx-auto px-4 py-10">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 class="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                <span>🏆</span>
                <span>Top 50 Álbuns da Comunidade</span>
              </h2>
              <p class="text-xs text-gray-400 mt-0.5">
                Os discos com as maiores médias de avaliação no Muly.
              </p>
            </div>
            <a routerLink="/catalog" class="text-xs text-emerald-400 hover:underline font-semibold">
              Explorar catálogo completo →
            </a>
          </div>

          @if (loadingRanking) {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              @for (s of [1, 2, 3, 4, 5, 6]; track s) {
                <div class="bg-[#1b2228] border border-[#2a343d] rounded-xl p-3.5 flex items-center gap-3.5">
                  <div class="w-8 h-6 rounded skeleton-shimmer shrink-0"></div>
                  <div class="w-12 h-12 rounded skeleton-shimmer shrink-0"></div>
                  <div class="flex-1 space-y-2">
                    <div class="h-3.5 w-1/2 rounded skeleton-shimmer"></div>
                    <div class="h-2.5 w-1/3 rounded skeleton-shimmer"></div>
                  </div>
                </div>
              }
            </div>
          } @else if (communityRanking.length > 0) {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              @for (album of visibleRankingAlbums; track album.externalId; let i = $index) {
                <div
                  [routerLink]="['/catalog/albums', album.externalId]"
                  class="cursor-pointer group bg-[#1b2228] border border-[#2a343d] hover:border-emerald-500/50 rounded-xl p-3.5 flex items-center justify-between gap-3 transition-all shadow-sm"
                >
                  <div class="flex items-center gap-3.5 min-w-0">
                    <span
                      class="w-8 text-center font-black text-base shrink-0 tabular-nums"
                      [ngClass]="i === 0 ? 'text-amber-400' : (i === 1 ? 'text-gray-300' : (i === 2 ? 'text-amber-600' : 'text-gray-500'))"
                    >
                      #{{ i + 1 }}
                    </span>

                    <div class="w-12 h-12 rounded-lg bg-[#12161a] overflow-hidden shrink-0 border border-[#242c34]">
                      @if (album.coverUrl) {
                        <img [src]="album.coverUrl" [alt]="album.title" class="w-full h-full object-cover" loading="lazy" />
                      } @else {
                        <div class="w-full h-full flex items-center justify-center text-gray-600 text-sm">💿</div>
                      }
                    </div>

                    <div class="min-w-0">
                      <h3 class="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors truncate">
                        {{ album.title }}
                      </h3>
                      <div class="flex items-center gap-1.5 text-xs text-gray-400 truncate">
                        <a
                          [routerLink]="['/catalog/artists', getPrimaryArtist(album.artist)]"
                          (click)="$event.stopPropagation()"
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

                  <div class="flex items-center gap-2.5 shrink-0">
                    <div class="text-right">
                      <span class="block text-sm font-black text-emerald-400 tabular-nums">
                        ★ {{ album.averageRating !== null ? formatRating(album.averageRating) : '—' }}
                      </span>
                      <span class="block text-[10px] text-gray-500">
                        {{ album.totalReviews }} {{ album.totalReviews === 1 ? 'avaliação' : 'avaliações' }}
                      </span>
                    </div>
                  </div>
                </div>
              }
            </div>

            @if (communityRanking.length > 10) {
              <div class="mt-6 text-center">
                <button
                  type="button"
                  (click)="showAllTop50 = !showAllTop50"
                  class="cursor-pointer text-xs font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 bg-[#1b2228] border border-[#2a343d] hover:border-emerald-500/40 px-5 py-2.5 rounded-lg transition-colors"
                >
                  {{ showAllTop50 ? 'Mostrar apenas Top 10' : 'Ver todos os ' + communityRanking.length + ' álbuns do Top 50' }}
                </button>
              </div>
            }
          } @else {
            <div class="p-8 bg-[#1b2228] border border-dashed border-[#2a343d] rounded-xl text-center text-xs text-gray-500">
              Ainda não há álbuns avaliados no ranking. Avalie um álbum para inaugurar o Top 50 da comunidade!
            </div>
          }
        </div>
      </section>
    </div>
  `
})
export class HomeComponent implements OnInit {
  authService = inject(AuthService);
  serverStatus = inject(ServerStatusService);
  private catalogService = inject(CatalogService);
  private reviewsService = inject(ReviewsService);
  private listsService = inject(ListsService);
  private router = inject(Router);

  @ViewChild('searchContainer') searchContainer?: ElementRef<HTMLElement>;

  searchQuery = '';
  liveResults: AlbumResponse[] = [];
  searchingLive = false;
  showDropdown = false;
  featuredAlbums: AlbumResponse[] = FALLBACK_FEATURED_ALBUMS;

  feedTab: 'trending' | 'following' | 'recent' = 'trending';
  feedReviews: ReviewResponse[] = [];
  loadingFeed = true;
  feedError = false;
  visibleReviewsLimit = 8;

  popularLists: AlbumListSummaryResponse[] = [];
  loadingLists = true;

  communityRanking: RankedAlbumResponse[] = [];
  loadingRanking = true;
  showAllTop50 = false;

  get visibleFeedReviews(): ReviewResponse[] {
    return this.feedReviews.slice(0, this.visibleReviewsLimit);
  }

  get weeklyAlbums(): Array<{ externalId: string; title: string; artist: string; coverUrl: string | null }> {
    if (this.communityRanking.length > 0) {
      return this.communityRanking.slice(0, 8);
    }
    return this.featuredAlbums.slice(0, 8);
  }

  get visibleRankingAlbums(): RankedAlbumResponse[] {
    return this.showAllTop50 ? this.communityRanking : this.communityRanking.slice(0, 10);
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showDropdown && !this.searchingLive) return;
    if (this.searchContainer && !this.searchContainer.nativeElement.contains(event.target as Node)) {
      this.showDropdown = false;
      this.searchingLive = false;
    }
  }

  ngOnInit(): void {
    this.loadFeed();
    this.loadPopularLists();
    this.loadCommunityRanking();

    const cachedAlbums = this.serverStatus.getCached<AlbumResponse[]>('http_/catalog/search?q=Radiohead');
    if (cachedAlbums && cachedAlbums.length > 0) {
      this.featuredAlbums = cachedAlbums.slice(0, 8);
    }

    this.catalogService.search('Radiohead').subscribe({
      next: (albums) => {
        if (albums && albums.length > 0) {
          this.featuredAlbums = albums.slice(0, 8);
        }
      },
      error: () => {}
    });
  }

  loadPopularLists(): void {
    this.loadingLists = true;
    this.listsService.getAllLists().subscribe({
      next: (lists) => {
        const sorted = [...(lists || [])].sort((a, b) => {
          const scoreA = (a.likesCount || 0) * 2 + (a.commentsCount || 0);
          const scoreB = (b.likesCount || 0) * 2 + (b.commentsCount || 0);
          if (scoreB !== scoreA) return scoreB - scoreA;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        this.popularLists = sorted.slice(0, 4);
        this.loadingLists = false;
      },
      error: () => {
        this.popularLists = [];
        this.loadingLists = false;
      }
    });
  }

  loadCommunityRanking(): void {
    this.loadingRanking = true;
    this.catalogService.getRanking(50).subscribe({
      next: (items) => {
        this.communityRanking = items || [];
        this.loadingRanking = false;
      },
      error: () => {
        this.communityRanking = [];
        this.loadingRanking = false;
      }
    });
  }

  scrollToTop50(): void {
    const el = document.getElementById('top-50-comunidade');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  selectFeedTab(tab: 'trending' | 'following' | 'recent'): void {
    this.feedTab = tab;
    this.visibleReviewsLimit = 8;
    this.loadFeed();
  }

  loadFeed(): void {
    this.feedError = false;
    const cachedFeed = this.serverStatus.getCached<ReviewResponse[]>(`http_/reviews/feed?tab=${this.feedTab}`);
    if (cachedFeed && cachedFeed.length > 0) {
      this.feedReviews = cachedFeed;
      this.loadingFeed = false;
    } else {
      this.loadingFeed = true;
    }

    this.reviewsService.getFeed(this.feedTab).subscribe({
      next: (reviews) => {
        this.feedReviews = reviews || [];
        this.loadingFeed = false;
        this.feedError = false;
      },
      error: () => {
        if (this.feedReviews.length === 0) {
          this.feedError = true;
        }
        this.loadingFeed = false;
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

  onSearchFocus(): void {
    if (this.searchQuery.trim().length > 1) {
      this.showDropdown = true;
    }
  }

  onSearchInput(): void {
    const q = this.searchQuery.trim();
    if (q.length > 1) {
      this.showDropdown = true;
      this.searchingLive = true;
      this.catalogService.search(q).subscribe({
        next: (res) => {
          if (this.searchQuery.trim() === q) {
            this.liveResults = res;
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
    this.liveResults = [];
    this.searchingLive = false;
    this.searchQuery = '';
    this.router.navigate(['/catalog/albums', externalId]);
  }

  search(): void {
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim();
      this.showDropdown = false;
      this.liveResults = [];
      this.searchingLive = false;
      this.router.navigate(['/catalog'], { queryParams: { q } });
    }
  }

  getPrimaryArtist(artist: string): string {
    if (!artist) return '';
    return artist.split(',')[0].trim();
  }

  formatRating(value: number | null | undefined): string {
    return formatRating(value);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }
}
