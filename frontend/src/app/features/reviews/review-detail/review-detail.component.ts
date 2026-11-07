import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserProfileResponse } from '../../../core/models/profile.models';
import { ReviewResponse } from '../../../core/models/reviews.models';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileService } from '../../../core/services/profile.service';
import { ReviewsService } from '../../../core/services/reviews.service';
import { ShareCardData, ShareCardModalComponent } from '../../../shared/components/share-card-modal/share-card-modal.component';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-review-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StarRatingComponent, ShareCardModalComponent],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8">
      <!-- Topo de Navegação -->
      <div class="flex items-center justify-between mb-6 pb-3 border-b border-[#242c34]">
        <button
          type="button"
          (click)="goBack()"
          class="cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-emerald-400 transition-colors"
        >
          <span>← Voltar</span>
        </button>

        @if (review) {
          <a
            [routerLink]="['/catalog/albums', review.albumExternalId]"
            class="text-xs font-bold uppercase tracking-wider text-emerald-400 hover:underline"
          >
            Ver página do álbum →
          </a>
        }
      </div>

      @if (loading && !review) {
        <div class="flex justify-center py-20 text-emerald-400">
          <svg class="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
        </div>
      } @else if (review) {

        <!-- 1. CABEÇALHO DO AUTOR: Avatar, Nome, Bio e Links Sociais -->
        <div class="bg-[#1b2228] border border-[#2a343d] rounded-xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
          <div class="flex items-center gap-4 min-w-0">
            <a
              [routerLink]="['/profile', review.username]"
              class="w-16 h-16 rounded-full bg-[#12161a] border-2 border-emerald-500 overflow-hidden flex items-center justify-center text-xl font-black text-white uppercase shrink-0 shadow-lg hover:scale-105 transition-transform"
            >
              @if (authorAvatarUrl) {
                <img [src]="authorAvatarUrl" [alt]="review.username" class="w-full h-full object-cover" />
              } @else {
                {{ (authorDisplayName || review.username).substring(0, 2) }}
              }
            </a>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <a
                  [routerLink]="['/profile', review.username]"
                  class="text-lg sm:text-xl font-black text-white hover:text-emerald-400 transition-colors truncate"
                >
                  {{ authorDisplayName || review.username }}
                </a>
                <a
                  [routerLink]="['/profile', review.username]"
                  class="text-xs font-semibold text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  &#64;{{ review.username }}
                </a>
              </div>

              @if (authorBio) {
                <p class="text-xs text-gray-300 mt-1 line-clamp-2 leading-relaxed">
                  {{ authorBio }}
                </p>
              } @else {
                <p class="text-xs text-gray-500 mt-1">
                  Avaliação publicada no Muly
                </p>
              }
            </div>
          </div>

          <!-- Links Sociais & Perfil do Autor -->
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            @if (authorSpotifyUrl) {
              <a
                [href]="getSpotifyHref(authorSpotifyUrl)"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 text-xs font-bold bg-[#14181c] hover:bg-[#202830] text-[#1DB954] border border-[#2a343d] px-3 py-2 rounded-lg transition-colors"
                title="Perfil no Spotify"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                <span>Spotify</span>
              </a>
            }

            @if (authorLastfmUrl) {
              <a
                [href]="getLastfmHref(authorLastfmUrl)"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 text-xs font-bold bg-[#14181c] hover:bg-[#202830] text-red-400 border border-[#2a343d] px-3 py-2 rounded-lg transition-colors"
                title="Perfil no Last.fm"
              >
                <span class="inline-block w-3.5 h-3.5 rounded-full bg-red-500 text-white font-black text-[9px] flex items-center justify-center leading-none">as</span>
                <span>Last.fm</span>
              </a>
            }

            <a
              [routerLink]="['/profile', review.username]"
              class="inline-flex items-center gap-1.5 text-xs font-bold bg-[#14181c] hover:bg-[#242c34] text-gray-200 border border-[#2a343d] px-3.5 py-2 rounded-lg transition-colors"
            >
              <span>Ver Perfil</span>
              <span>→</span>
            </a>
          </div>
        </div>

        <!-- 2. GRID PRINCIPAL: Esquerda (Álbum + Link) | Direita (Review + Comentários) -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          <!-- COLUNA ESQUERDA: Card do Álbum + Links -->
          <div class="lg:col-span-1 bg-[#1b2228] border border-[#2a343d] rounded-xl p-5 flex flex-col items-center text-center shadow-lg">
            <a
              [routerLink]="['/catalog/albums', review.albumExternalId]"
              class="group relative w-48 h-48 sm:w-56 sm:h-56 rounded-xl overflow-hidden bg-[#12161a] border border-[#2a343d] shadow-2xl block"
            >
              @if (review.albumCoverUrl) {
                <img
                  [src]="review.albumCoverUrl"
                  [alt]="review.albumTitle"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              } @else {
                <div class="w-full h-full flex items-center justify-center text-4xl font-black text-emerald-400 uppercase">
                  {{ review.albumTitle.substring(0, 1) }}
                </div>
              }
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span class="bg-emerald-500 text-black font-black text-xs uppercase tracking-wider px-3 py-1.5 rounded-lg shadow">
                  Abrir Álbum
                </span>
              </div>
            </a>

            <div class="mt-4 w-full">
              @if (review.trackNumber !== null) {
                <span class="inline-block text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-0.5 rounded-full mb-2">
                  🎵 Faixa #{{ review.trackNumber }} • {{ review.trackTitle }}
                </span>
              } @else {
                <span class="inline-block text-[11px] font-semibold bg-[#12161a] text-gray-400 border border-[#242c34] px-3 py-0.5 rounded-full mb-2">
                  💿 Álbum Completo
                </span>
              }

              <a
                [routerLink]="['/catalog/albums', review.albumExternalId]"
                class="block text-lg font-black text-white hover:text-emerald-400 transition-colors leading-snug"
              >
                {{ review.albumTitle }}
              </a>
              <p class="text-sm font-semibold text-emerald-400 mt-0.5">
                {{ review.albumArtist }}
              </p>
              @if (review.albumReleaseYear) {
                <p class="text-xs text-gray-500 mt-0.5">Lançamento: {{ review.albumReleaseYear }}</p>
              }
            </div>

            <div class="mt-5 pt-4 border-t border-[#242c34] w-full flex flex-col gap-2.5">
              <a
                [routerLink]="['/catalog/albums', review.albumExternalId]"
                class="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-lg transition-colors text-center shadow"
              >
                💿 Ver Álbum & Faixas
              </a>

              <a
                [href]="'https://open.spotify.com/album/' + review.albumExternalId"
                target="_blank"
                rel="noopener noreferrer"
                class="w-full inline-flex items-center justify-center gap-2 bg-[#14181c] hover:bg-[#202830] text-[#1DB954] border border-[#2a343d] font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-lg transition-colors"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                <span>Ouvir no Spotify</span>
              </a>
            </div>
          </div>

          <!-- COLUNA DIREITA: Card da Review + Seção de Comentários -->
          <div class="lg:col-span-2 space-y-6">

            <!-- Card Principal da Review -->
            <div class="bg-[#1b2228] border border-emerald-500/40 rounded-xl p-6 shadow-xl">
              <div class="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#242c34]">
                <div class="flex flex-wrap items-center gap-2.5">
                  <a
                    [routerLink]="['/profile', review.username]"
                    class="inline-flex items-center gap-2 font-black text-sm text-white hover:text-emerald-400 transition-colors"
                  >
                    <span class="w-7 h-7 rounded-full bg-[#12161a] border border-emerald-500/60 overflow-hidden flex items-center justify-center text-[10px] font-black text-white uppercase shrink-0">
                      @if (authorAvatarUrl) {
                        <img [src]="authorAvatarUrl" [alt]="review.username" class="w-full h-full object-cover" />
                      } @else {
                        {{ (authorDisplayName || review.username).substring(0, 2) }}
                      }
                    </span>
                    <span>{{ authorDisplayName || review.username }}</span>
                  </a>

                  @if (review.trackNumber !== null) {
                    <span class="text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                      🎵 Faixa #{{ review.trackNumber }} - {{ review.trackTitle }}
                    </span>
                  } @else {
                    <span class="text-[11px] font-semibold bg-[#12161a] text-gray-400 border border-[#242c34] px-2.5 py-0.5 rounded-full">
                      💿 Review do Álbum
                    </span>
                  }

                  <span class="text-xs text-gray-500">• {{ formatDate(review.createdAt) }}</span>
                </div>

                <!-- Estrelas em Destaque -->
                <app-star-rating [rating]="review.rating" [readonly]="true" />
              </div>

              <!-- Texto da Review -->
              <div class="py-5">
                @if (review.reviewText) {
                  <p class="text-sm sm:text-base text-gray-100 leading-relaxed whitespace-pre-wrap break-words">
                    {{ review.reviewText }}
                  </p>
                } @else {
                  <p class="text-xs italic text-gray-500">
                    Avaliação apenas com nota ({{ review.rating.toFixed(1) }} estrelas), sem texto escrito.
                  </p>
                }
              </div>

              <!-- Barra de Ações Mobile-Friendly (Like Grande, Comentar, Compartilhar) -->
              <div class="pt-4 border-t border-[#242c34] flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <!-- Botão de Like Grande para Mobile -->
                  <button
                    type="button"
                    (click)="toggleLike()"
                    class="cursor-pointer min-h-[44px] px-5 py-2 rounded-full text-sm font-black inline-flex items-center gap-2 border transition-all active:scale-95"
                    [ngClass]="review.likedByMe
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-sm'
                      : 'bg-[#14181c] border-[#2a343d] text-gray-300 hover:border-rose-500/40 hover:text-rose-400'"
                  >
                    <span class="text-lg leading-none">{{ review.likedByMe ? '♥' : '♡' }}</span>
                    <span>{{ review.likesCount || 0 }}</span>
                    <span class="text-xs font-bold hidden sm:inline">{{ review.likedByMe ? 'Curtido' : 'Curtir' }}</span>
                  </button>

                  <!-- Botão de Focar no Comentário -->
                  <button
                    type="button"
                    (click)="focusCommentInput()"
                    class="cursor-pointer min-h-[44px] px-4 py-2 rounded-full text-sm font-bold inline-flex items-center gap-2 bg-[#14181c] border border-[#2a343d] text-gray-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-all active:scale-95"
                  >
                    <span class="text-base leading-none">💬</span>
                    <span>{{ review.comments?.length || review.commentsCount || 0 }}</span>
                    <span class="text-xs font-bold">Comentar</span>
                  </button>
                </div>

                <button
                  type="button"
                  (click)="shareReview()"
                  class="cursor-pointer min-h-[44px] px-4 py-2 rounded-full text-xs font-bold inline-flex items-center gap-1.5 bg-[#14181c] border border-[#2a343d] text-gray-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>Compartilhar</span>
                </button>
              </div>
            </div>

            <!-- Seção de Comentários (COMMENTS) -->
            <div #commentsSection class="bg-[#1b2228] border border-[#2a343d] rounded-xl p-6 shadow-lg">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <span>💬 Comentários ({{ review.comments?.length || 0 }})</span>
                </h2>
              </div>

              <!-- Lista de Comentários -->
              @if (review.comments && review.comments.length > 0) {
                <div class="space-y-3 mb-5">
                  @for (c of review.comments; track c.id) {
                    <div class="bg-[#14181c] border border-[#242c34] rounded-xl p-3.5 flex items-start justify-between gap-3">
                      <div class="flex items-start gap-3 min-w-0">
                        <a
                          [routerLink]="['/profile', c.username]"
                          class="w-8 h-8 rounded-full bg-[#1b2228] border border-emerald-500/40 overflow-hidden flex items-center justify-center text-[10px] font-black text-white uppercase shrink-0 mt-0.5"
                        >
                          @if (c.userAvatarUrl) {
                            <img [src]="c.userAvatarUrl" [alt]="c.username" class="w-full h-full object-cover" />
                          } @else {
                            {{ (c.userDisplayName || c.username).substring(0, 2) }}
                          }
                        </a>
                        <div class="min-w-0">
                          <div class="flex flex-wrap items-center gap-2">
                            <a
                              [routerLink]="['/profile', c.username]"
                              class="text-xs font-bold text-emerald-400 hover:underline"
                            >
                              {{ c.userDisplayName || c.username }}
                            </a>
                            <span class="text-[11px] text-gray-500">&#64;{{ c.username }}</span>
                            <span class="text-[10px] text-gray-500">• {{ formatDate(c.createdAt) }}</span>
                          </div>
                          <p class="text-xs sm:text-sm text-gray-200 mt-1 break-words leading-relaxed">
                            {{ c.content }}
                          </p>
                        </div>
                      </div>

                      @if (canDeleteComment(c.username, review.username)) {
                        <button
                          type="button"
                          (click)="deleteComment(c.id)"
                          class="cursor-pointer text-xs text-gray-500 hover:text-red-400 p-1.5 rounded transition-colors shrink-0"
                          title="Excluir comentário"
                        >
                          ✕
                        </button>
                      }
                    </div>
                  }
                </div>
              } @else {
                <div class="bg-[#14181c] border border-dashed border-[#242c34] rounded-xl p-6 text-center mb-5">
                  <p class="text-xs text-gray-400">Nenhum comentário ainda. Seja o primeiro a responder abaixo!</p>
                </div>
              }

              <!-- Caixa de Comentário (Onde você mesmo pode comentar) -->
              @if (authService.isAuthenticated()) {
                <form (ngSubmit)="submitComment()" class="flex flex-col sm:flex-row gap-2.5">
                  <input
                    #commentInputEl
                    type="text"
                    name="commentText"
                    [(ngModel)]="commentText"
                    placeholder="Responder a esta avaliação..."
                    class="flex-1 bg-[#12161a] border border-[#2a343d] rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    [disabled]="submittingComment || !commentText.trim()"
                    class="cursor-pointer disabled:opacity-50 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-colors shadow-md shrink-0"
                  >
                    {{ submittingComment ? 'Enviando...' : 'Enviar' }}
                  </button>
                </form>
              } @else {
                <div class="bg-[#14181c] border border-[#242c34] rounded-xl p-4 flex items-center justify-between gap-3">
                  <p class="text-xs text-gray-400">Entre na sua conta para curtir e comentar nesta avaliação.</p>
                  <a
                    routerLink="/login"
                    [queryParams]="{ returnUrl: '/reviews/' + review.id }"
                    class="bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider px-4 py-2 rounded-lg transition-colors shrink-0"
                  >
                    Entrar
                  </a>
                </div>
              }
            </div>

          </div>
        </div>

      } @else {
        <div class="bg-[#1b2228] border border-[#2a343d] rounded-xl p-10 text-center">
          <p class="text-sm font-bold text-gray-200">Avaliação não encontrada</p>
          <p class="text-xs text-gray-400 mt-1">Esta review pode ter sido removida ou o link está incorreto.</p>
          <a
            routerLink="/"
            class="inline-block mt-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg transition-colors"
          >
            Voltar para o Início
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
export class ReviewDetailComponent implements OnInit {
  authService = inject(AuthService);
  private reviewsService = inject(ReviewsService);
  private profileService = inject(ProfileService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private titleService = inject(Title);
  private metaService = inject(Meta);

  @ViewChild('commentInputEl') commentInputEl?: ElementRef<HTMLInputElement>;
  @ViewChild('commentsSection') commentsSection?: ElementRef<HTMLElement>;

  review: ReviewResponse | null = null;
  authorProfile: UserProfileResponse | null = null;
  loading = true;
  shouldFocusComment = false;

  commentText = '';
  submittingComment = false;

  shareModalOpen = false;
  shareCardData: ShareCardData | null = null;

  get authorDisplayName(): string | null {
    return this.authorProfile?.displayName || this.review?.userDisplayName || null;
  }

  get authorAvatarUrl(): string | null {
    return this.authorProfile?.avatarUrl || this.review?.userAvatarUrl || null;
  }

  get authorBio(): string | null {
    return this.authorProfile?.bio || this.review?.userBio || null;
  }

  get authorSpotifyUrl(): string | null {
    return this.authorProfile?.spotifyProfileUrl || this.review?.userSpotifyUrl || null;
  }

  get authorLastfmUrl(): string | null {
    return this.authorProfile?.lastfmProfileUrl || this.review?.userLastfmUrl || null;
  }

  ngOnInit(): void {
    // Se veio navegando do Feed / Perfil / Álbum, exibe instantaneamente a review do state
    const navState = history.state as { review?: ReviewResponse } | undefined;
    if (navState?.review) {
      this.review = navState.review;
      this.loading = false;
      this.loadAuthorProfile(this.review.username);
    }

    this.route.queryParamMap.subscribe(qParams => {
      this.shouldFocusComment = qParams.get('focus') === 'comment';
      if (this.shouldFocusComment && this.review) {
        this.scheduleCommentFocus();
      }
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      const albumParam = this.route.snapshot.queryParamMap.get('album');
      if (id) {
        this.loadReview(id, albumParam || this.review?.albumExternalId || null);
      }
    });
  }

  private loadReview(reviewId: string, fallbackAlbumId: string | null): void {
    if (!this.review) {
      this.loading = true;
    }

    this.reviewsService.getReviewById(reviewId).subscribe({
      next: (rev) => {
        this.review = rev;
        this.loading = false;
        this.updateMetaTags(rev);
        this.loadAuthorProfile(rev.username);
        if (this.shouldFocusComment) {
          this.scheduleCommentFocus();
        }
      },
      error: () => {
        // Fallback caso o container no Render ainda esteja atualizando
        if (fallbackAlbumId) {
          this.reviewsService.getReviewsByAlbum(fallbackAlbumId).subscribe({
            next: (summary) => {
              const all = [...(summary.reviews || []), ...(summary.trackReviews || [])];
              const found = all.find(r => r.id === reviewId);
              if (found) {
                this.review = found;
                this.updateMetaTags(found);
                this.loadAuthorProfile(found.username);
                if (this.shouldFocusComment) {
                  this.scheduleCommentFocus();
                }
              }
              this.loading = false;
            },
            error: () => {
              this.loading = false;
            }
          });
        } else {
          this.loading = false;
        }
      }
    });
  }

  private loadAuthorProfile(username: string): void {
    if (!username) return;
    this.profileService.getProfile(username).subscribe({
      next: (prof) => {
        this.authorProfile = prof;
      },
      error: () => {}
    });
  }

  private updateMetaTags(rev: ReviewResponse): void {
    const targetName = rev.trackNumber !== null
      ? `${rev.trackTitle} (${rev.albumTitle})`
      : `${rev.albumTitle} — ${rev.albumArtist}`;
    const pageTitle = `Review de @${rev.username} para ${targetName} | Muly`;
    this.titleService.setTitle(pageTitle);
    this.metaService.updateTag({ property: 'og:title', content: pageTitle });
    if (rev.reviewText) {
      this.metaService.updateTag({ property: 'og:description', content: rev.reviewText });
    }
    if (rev.albumCoverUrl) {
      this.metaService.updateTag({ property: 'og:image', content: rev.albumCoverUrl });
    }
  }

  private scheduleCommentFocus(): void {
    setTimeout(() => {
      this.focusCommentInput();
    }, 180);
  }

  focusCommentInput(): void {
    if (this.commentsSection?.nativeElement) {
      this.commentsSection.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => {
      this.commentInputEl?.nativeElement?.focus();
    }, 220);
  }

  toggleLike(): void {
    if (!this.review) return;
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/reviews/${this.review.id}` } });
      return;
    }

    this.reviewsService.toggleLike(this.review.id).subscribe({
      next: (updated) => {
        if (this.review) {
          this.review.likedByMe = updated.likedByMe;
          this.review.likesCount = updated.likesCount;
        }
      }
    });
  }

  submitComment(): void {
    if (!this.review) return;
    const text = this.commentText.trim();
    if (!text) return;

    this.submittingComment = true;
    this.reviewsService.addComment(this.review.id, { content: text }).subscribe({
      next: (comment) => {
        if (this.review) {
          this.review.comments = [...(this.review.comments || []), comment];
          this.review.commentsCount = this.review.comments.length;
        }
        this.commentText = '';
        this.submittingComment = false;
      },
      error: () => {
        this.submittingComment = false;
      }
    });
  }

  canDeleteComment(commentAuthor: string, reviewOwner: string): boolean {
    const current = this.authService.currentUser()?.toLowerCase();
    if (!current) return false;
    return current === commentAuthor.toLowerCase() || current === reviewOwner.toLowerCase();
  }

  deleteComment(commentId: string): void {
    if (!this.review) return;
    this.reviewsService.deleteComment(this.review.id, commentId).subscribe({
      next: () => {
        if (this.review) {
          this.review.comments = (this.review.comments || []).filter(c => c.id !== commentId);
          this.review.commentsCount = this.review.comments.length;
        }
      }
    });
  }

  shareReview(): void {
    if (!this.review) return;
    const url = `${window.location.origin}/reviews/${this.review.id}`;
    navigator.clipboard?.writeText(url);

    this.shareCardData = {
      type: 'review',
      url,
      title: this.review.albumTitle,
      subtitle: this.review.albumArtist,
      username: this.review.username,
      rating: this.review.rating,
      reviewText: this.review.reviewText,
      trackBadge: this.review.trackNumber !== null ? `Faixa #${this.review.trackNumber} • ${this.review.trackTitle}` : null,
      coverUrl: this.review.albumCoverUrl
    };
    this.shareModalOpen = true;
  }

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/']);
    }
  }

  getSpotifyHref(raw: string): string {
    const trimmed = raw.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://open.spotify.com/user/${encodeURIComponent(trimmed.replace(/^@/, ''))}`;
  }

  getLastfmHref(raw: string): string {
    const trimmed = raw.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://www.last.fm/user/${encodeURIComponent(trimmed.replace(/^@/, ''))}`;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
