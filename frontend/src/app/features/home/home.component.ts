import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AlbumResponse } from '../../core/models/catalog.models';
import { ReviewResponse } from '../../core/models/reviews.models';
import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '../../core/services/catalog.service';
import { ReviewsService } from '../../core/services/reviews.service';
import { AlbumCardComponent } from '../../shared/components/album-card/album-card.component';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AlbumCardComponent, StarRatingComponent],
  template: `
    <div>
      <!-- Hero Section -->
      <section class="py-10 sm:py-16 px-4 text-center border-b border-[#242c34] bg-gradient-to-b from-[#181e24] to-[#14181c]">
        <div class="max-w-3xl mx-auto">
          <span class="inline-block text-[10px] sm:text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full mb-3 sm:mb-4">
            A rede social para quem ama música
          </span>
          <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Catalogue o que você ouve. Compartilhe o que você sente.
          </h1>
          <p class="text-sm sm:text-base text-gray-400 mt-3 leading-relaxed max-w-xl mx-auto">
            Registre suas audições com notas de 0.5 a 5 estrelas, monte listas temáticas e acompanhe o que seus amigos andam ouvindo.
          </p>

          <!-- Input de Busca Rápida com Autocomplete em Tempo Real -->
          <div #searchContainer class="mt-7 max-w-md mx-auto relative text-left">
            <form (ngSubmit)="search()" class="flex gap-2">
              <input
                type="text"
                name="searchQuery"
                [(ngModel)]="searchQuery"
                (focus)="onSearchFocus()"
                (input)="onSearchInput()"
                autocomplete="off"
                placeholder="Buscar artista, banda ou álbum..."
                class="flex-1 bg-[#101417] border border-[#2a343d] rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500 shadow-inner"
              />
              <button
                type="submit"
                class="cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-3 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-md"
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
            <div class="mt-6 flex items-center justify-center gap-4 text-xs font-semibold">
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

      <!-- Feed de Atividade Social -->
      <section class="max-w-6xl mx-auto px-4 pt-10 pb-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 class="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Feed de Atividade</span>
            </h2>
            <p class="text-xs text-gray-400 mt-0.5">
              Acompanhe as resenhas e notas mais recentes de amigos e da comunidade.
            </p>
          </div>

          <!-- Abas do Feed -->
          <div class="inline-flex items-center bg-[#181e24] border border-[#2a343d] rounded-lg p-1 self-start sm:self-auto">
            @if (authService.isAuthenticated()) {
              <button
                type="button"
                (click)="selectFeedTab('following')"
                class="cursor-pointer text-xs font-bold px-3.5 py-1.5 rounded-md transition-colors"
                [ngClass]="feedTab === 'following' ? 'bg-emerald-500 text-black shadow' : 'text-gray-400 hover:text-white'"
              >
                👥 Seguindo
              </button>
            }
            <button
              type="button"
              (click)="selectFeedTab('trending')"
              class="cursor-pointer text-xs font-bold px-3.5 py-1.5 rounded-md transition-colors"
              [ngClass]="feedTab === 'trending' ? 'bg-emerald-500 text-black shadow' : 'text-gray-400 hover:text-white'"
            >
              🔥 Em Alta
            </button>
            <button
              type="button"
              (click)="selectFeedTab('recent')"
              class="cursor-pointer text-xs font-bold px-3.5 py-1.5 rounded-md transition-colors"
              [ngClass]="feedTab === 'recent' ? 'bg-emerald-500 text-black shadow' : 'text-gray-400 hover:text-white'"
            >
              🕒 Recentes
            </button>
          </div>
        </div>

        @if (loadingFeed) {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (s of [1, 2, 3, 4]; track s) {
              <div class="bg-[#1b2228] border border-[#2a343d] rounded-xl p-5 flex gap-4">
                <div class="w-16 h-16 rounded skeleton-shimmer shrink-0"></div>
                <div class="flex-1 space-y-2.5">
                  <div class="h-3.5 w-1/2 rounded skeleton-shimmer"></div>
                  <div class="h-3 w-3/4 rounded skeleton-shimmer"></div>
                  <div class="h-2.5 w-full rounded skeleton-shimmer"></div>
                </div>
              </div>
            }
          </div>
        } @else if (feedReviews.length > 0) {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (rev of feedReviews; track rev.id) {
              <div
                (click)="openReview(rev)"
                class="cursor-pointer group/card bg-[#1b2228] border border-[#2a343d] hover:border-emerald-500/50 hover:bg-[#1e262d] rounded-xl p-5 flex flex-col justify-between transition-all shadow"
              >
                <div>
                  <!-- Cabeçalho do Autor -->
                  <div class="flex items-center justify-between gap-2 mb-3">
                    <a
                      [routerLink]="['/profile', rev.username]"
                      (click)="$event.stopPropagation()"
                      class="inline-flex items-center gap-2 group min-w-0"
                    >
                      <span class="w-7 h-7 rounded-full bg-[#12161a] border border-emerald-500/60 overflow-hidden flex items-center justify-center text-[10px] font-black text-white uppercase shrink-0">
                        @if (rev.userAvatarUrl) {
                          <img [src]="rev.userAvatarUrl" [alt]="rev.username" class="w-full h-full object-cover" />
                        } @else {
                          {{ (rev.userDisplayName || rev.username).substring(0, 2) }}
                        }
                      </span>
                      <div class="truncate">
                        <span class="text-xs font-bold text-gray-100 group-hover:text-emerald-400 transition-colors">
                          {{ rev.userDisplayName || rev.username }}
                        </span>
                        <span class="text-[11px] text-gray-500 ml-1">&#64;{{ rev.username }}</span>
                      </div>
                    </a>

                    <app-star-rating [rating]="rev.rating" [readonly]="true" />
                  </div>

                  <!-- Álbum / Música Avaliada (Clicável junto com o Card) -->
                  <div class="flex items-start gap-3.5 bg-[#14181c] border border-[#242c34] group-hover/card:border-[#2f3b47] rounded-lg p-3 transition-colors">
                    @if (rev.albumCoverUrl) {
                      <img
                        [src]="rev.albumCoverUrl"
                        [alt]="rev.albumTitle"
                        class="w-14 h-14 rounded object-cover shadow border border-[#2a343d] shrink-0"
                      />
                    }
                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap items-center gap-1.5">
                        @if (rev.trackNumber !== null) {
                          <span class="text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            🎵 Faixa #{{ rev.trackNumber }} • {{ rev.trackTitle }}
                          </span>
                        } @else {
                          <span class="text-[10px] font-semibold bg-[#1b2228] text-gray-400 border border-[#2a343d] px-2 py-0.5 rounded-full">
                            💿 Álbum
                          </span>
                        }
                      </div>
                      <p class="font-black text-sm text-white group-hover/card:text-emerald-400 transition-colors truncate mt-1">
                        {{ rev.albumTitle }}
                      </p>
                      <p class="text-xs text-gray-400 truncate">{{ rev.albumArtist }}</p>
                    </div>
                  </div>

                  @if (rev.reviewText) {
                    <p class="text-xs text-gray-300 leading-relaxed mt-3 line-clamp-3 whitespace-pre-wrap">
                      {{ rev.reviewText }}
                    </p>
                  }
                </div>

                <!-- Rodapé de Interação do Card (Botões Grandes para Mobile) -->
                <div class="mt-4 pt-3 border-t border-[#242c34]">
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2.5">
                      <!-- Botão de Like Grande para Mobile -->
                      <button
                        type="button"
                        (click)="toggleLikeReview(rev, $event)"
                        class="cursor-pointer min-h-[42px] px-4 py-2 rounded-full text-sm font-black inline-flex items-center gap-2 border transition-all active:scale-95"
                        [ngClass]="rev.likedByMe
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-sm'
                          : 'bg-[#14181c] border-[#2a343d] text-gray-300 hover:border-rose-500/40 hover:text-rose-400'"
                        title="Curtir avaliação"
                      >
                        <span class="text-base leading-none">{{ rev.likedByMe ? '♥' : '♡' }}</span>
                        <span>{{ rev.likesCount || 0 }}</span>
                      </button>

                      <!-- Botão de Comentário que leva direto para a página da review focando no input -->
                      <button
                        type="button"
                        (click)="openReviewComments(rev, $event)"
                        class="cursor-pointer min-h-[42px] px-4 py-2 rounded-full text-sm font-bold inline-flex items-center gap-2 bg-[#14181c] border border-[#2a343d] text-gray-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-all active:scale-95"
                        title="Ver e adicionar comentários"
                      >
                        <span class="text-sm leading-none">💬</span>
                        <span>{{ rev.commentsCount || (rev.comments?.length || 0) }}</span>
                      </button>
                    </div>

                    <div class="flex items-center gap-3">
                      <span class="text-[10px] text-gray-500">{{ formatDate(rev.createdAt) }}</span>
                      <span class="text-xs font-bold text-emerald-400 group-hover/card:underline">
                        Ver →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="p-10 bg-[#1b2228] border border-dashed border-[#2a343d] rounded-xl text-center">
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
            } @else {
              <p class="text-xs text-gray-400">
                Ainda não há avaliações publicadas. Busque um álbum acima e seja o primeiro a avaliar!
              </p>
            }
          </div>
        }
      </section>

      <!-- Álbuns em Destaque / Clássicos -->
      <section class="max-w-6xl mx-auto px-4 py-10">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xs font-black uppercase tracking-widest text-gray-300">
            Destaques do Catálogo
          </h2>
          <a routerLink="/catalog" class="text-xs text-emerald-400 hover:underline font-semibold">
            Explorar catálogo completo →
          </a>
        </div>

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
        } @else {
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            @for (album of featuredAlbums; track album.externalId) {
              <app-album-card [album]="album" />
            }
          </div>
        }
      </section>
    </div>
  `
})
export class HomeComponent implements OnInit {
  authService = inject(AuthService);
  private catalogService = inject(CatalogService);
  private reviewsService = inject(ReviewsService);
  private router = inject(Router);

  @ViewChild('searchContainer') searchContainer?: ElementRef<HTMLElement>;

  searchQuery = '';
  liveResults: AlbumResponse[] = [];
  searchingLive = false;
  showDropdown = false;
  featuredAlbums: AlbumResponse[] = [];
  loading = true;

  feedTab: 'trending' | 'following' | 'recent' = 'trending';
  feedReviews: ReviewResponse[] = [];
  loadingFeed = true;
  openCommentsMap: Record<string, boolean> = {};
  commentInputs: Record<string, string> = {};

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

    this.catalogService.search('Radiohead').subscribe({
      next: (albums) => {
        this.featuredAlbums = albums.slice(0, 10);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  selectFeedTab(tab: 'trending' | 'following' | 'recent'): void {
    this.feedTab = tab;
    this.loadFeed();
  }

  loadFeed(): void {
    this.loadingFeed = true;
    this.reviewsService.getFeed(this.feedTab).subscribe({
      next: (reviews) => {
        this.feedReviews = reviews || [];
        this.loadingFeed = false;
      },
      error: () => {
        this.feedReviews = [];
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

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }
}
