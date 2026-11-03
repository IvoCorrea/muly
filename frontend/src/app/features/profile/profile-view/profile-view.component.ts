import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UserProfileResponse } from '../../../core/models/profile.models';
import { ReviewResponse } from '../../../core/models/reviews.models';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileService } from '../../../core/services/profile.service';
import { ReviewsService } from '../../../core/services/reviews.service';
import { AlbumCardComponent } from '../../../shared/components/album-card/album-card.component';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule, RouterLink, AlbumCardComponent, StarRatingComponent],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8">
      
      @if (loading) {
        <div class="flex items-center justify-center py-24 text-emerald-400">
          <svg class="animate-spin h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
        </div>
      } @else if (profile) {
        
        <!-- Header do Perfil -->
        <div class="bg-[#1b2228] border border-[#2a343d] rounded-xl p-6 sm:p-8 mb-10 shadow-lg relative overflow-hidden">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            
            <div class="flex items-center gap-5">
              <div class="w-20 h-20 rounded-full bg-[#12161a] border-2 border-emerald-500 flex items-center justify-center text-white font-black text-2xl uppercase shadow-md">
                {{ profile.username.substring(0, 2) }}
              </div>
              <div>
                <h1 class="text-2xl sm:text-3xl font-black text-white tracking-wide">
                  {{ profile.username }}
                </h1>
                <p class="text-xs text-gray-400 mt-1">
                  Membro desde {{ formatDate(profile.memberSince) }}
                </p>
                <div class="mt-2 inline-flex items-center gap-2 bg-[#12161a] px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 border border-[#242c34]">
                  <span>{{ profile.totalReviews }}</span>
                  <span class="text-gray-400 font-normal">{{ profile.totalReviews === 1 ? 'álbum avaliado' : 'álbuns avaliados' }}</span>
                </div>
              </div>
            </div>

            @if (isOwnProfile) {
              <a
                routerLink="/profile/me/edit"
                class="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg transition-colors shadow-md"
              >
                Customizar Perfil
              </a>
            }
          </div>
        </div>

        <!-- Seção: Álbum Favorito em Destaque -->
        @if (profile.favoriteAlbum) {
          <div class="mb-10">
            <h2 class="text-xs font-black uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-2">
              <span>★</span> Álbum Favorito de Todos os Tempos
            </h2>
            <div class="bg-gradient-to-r from-[#1c2228] to-[#14181c] border border-emerald-500/30 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-6 shadow-xl">
              <div class="w-36 h-36 rounded-lg overflow-hidden shadow-2xl shrink-0 border border-[#2a343d]">
                <img
                  [src]="profile.favoriteAlbum.coverUrl"
                  [alt]="profile.favoriteAlbum.title"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="text-center sm:text-left">
                <span class="text-[10px] uppercase font-bold text-gray-500 bg-[#12161a] px-2 py-0.5 rounded">
                  {{ profile.favoriteAlbum.releaseYear }}
                </span>
                <h3 class="text-2xl font-black text-white mt-1">
                  {{ profile.favoriteAlbum.title }}
                </h3>
                <p class="text-base text-emerald-400 font-semibold mt-0.5">
                  {{ profile.favoriteAlbum.artist }}
                </p>
                <a
                  [routerLink]="['/catalog/albums', profile.favoriteAlbum.externalId]"
                  class="inline-block mt-4 text-xs font-bold text-gray-300 hover:text-white uppercase tracking-wider bg-[#242c34] hover:bg-[#2c3640] px-4 py-2 rounded transition-colors"
                >
                  Ver no Catálogo →
                </a>
              </div>
            </div>
          </div>
        }

        <!-- Seção: Top 4 Álbuns -->
        <div class="mb-12">
          <h2 class="text-xs font-black uppercase tracking-widest text-gray-300 mb-4 flex items-center justify-between">
            <span>Top 4 Álbuns Favoritos</span>
            @if (isOwnProfile && profile.topAlbums.length === 0) {
              <a routerLink="/profile/me/edit" class="text-emerald-400 text-xs hover:underline font-semibold lowercase">
                + adicionar meus 4 favoritos
              </a>
            }
          </h2>

          @if (profile.topAlbums.length > 0) {
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              @for (item of profile.topAlbums; track item.position) {
                <div class="relative">
                  <span class="absolute -top-2.5 -left-2.5 w-6 h-6 rounded-full bg-emerald-500 text-black font-black text-xs flex items-center justify-center z-10 shadow">
                    {{ item.position }}
                  </span>
                  <app-album-card [album]="item.album" />
                </div>
              }
            </div>
          } @else {
            <div class="p-8 border border-dashed border-[#2a343d] rounded-lg text-center text-xs text-gray-500">
              Nenhum álbum adicionado aos favoritos ainda.
            </div>
          }
        </div>

        <!-- Seção: Resenhas e Avaliações do Usuário -->
        <div>
          <h2 class="text-xs font-black uppercase tracking-widest text-gray-300 mb-4">
            Resenhas & Notas de {{ profile.username }} ({{ userReviews.length }})
          </h2>

          @if (userReviews.length > 0) {
            <div class="space-y-4">
              @for (rev of userReviews; track rev.id) {
                <div class="bg-[#1b2228] border border-[#2a343d] rounded-lg p-5 flex flex-col sm:flex-row gap-5 items-start">
                  @if (rev.albumCoverUrl) {
                    <a [routerLink]="['/catalog/albums', rev.albumExternalId]" class="shrink-0">
                      <img [src]="rev.albumCoverUrl" [alt]="rev.albumTitle" class="w-16 h-16 rounded object-cover shadow border border-[#2a343d]" />
                    </a>
                  }
                  <div class="flex-1">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <a
                          [routerLink]="['/catalog/albums', rev.albumExternalId]"
                          class="font-bold text-sm text-gray-100 hover:text-emerald-400 transition-colors"
                        >
                          {{ rev.albumTitle }}
                        </a>
                        <span class="text-xs text-gray-400 ml-1">por {{ rev.albumArtist }}</span>
                      </div>
                      <app-star-rating [rating]="rev.rating" [readonly]="true" />
                    </div>

                    @if (rev.reviewText) {
                      <p class="text-xs text-gray-300 leading-relaxed mt-2 whitespace-pre-wrap">
                        {{ rev.reviewText }}
                      </p>
                    }
                    <span class="text-[10px] text-gray-500 mt-2 block">
                      Avaliado em {{ formatDate(rev.createdAt) }}
                    </span>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="p-8 border border-dashed border-[#2a343d] rounded-lg text-center text-xs text-gray-500">
              Este usuário ainda não avaliou nenhum álbum.
            </div>
          }
        </div>

      } @else {
        <div class="text-center py-20 text-gray-400">
          <p>Perfil não encontrado.</p>
          <a routerLink="/" class="text-emerald-400 text-xs font-semibold hover:underline mt-2 inline-block">
            Voltar para o início
          </a>
        </div>
      }

    </div>
  `
})
export class ProfileViewComponent implements OnInit {
  authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private reviewsService = inject(ReviewsService);
  private route = inject(ActivatedRoute);

  profile: UserProfileResponse | null = null;
  userReviews: ReviewResponse[] = [];
  loading = true;

  get isOwnProfile(): boolean {
    return !!this.profile && this.authService.currentUser()?.toLowerCase() === this.profile.username.toLowerCase();
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const username = params.get('username');
      if (username) {
        this.loadProfile(username);
      }
    });
  }

  loadProfile(username: string): void {
    this.loading = true;
    this.profileService.getProfile(username).subscribe({
      next: (data) => {
        this.profile = data;
        this.loadReviews(username);
      },
      error: () => {
        this.profile = null;
        this.loading = false;
      }
    });
  }

  loadReviews(username: string): void {
    this.reviewsService.getReviewsByUser(username).subscribe({
      next: (reviews) => {
        this.userReviews = reviews;
        this.loading = false;
      },
      error: () => {
        this.userReviews = [];
        this.loading = false;
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  }
}
