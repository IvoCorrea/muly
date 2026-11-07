import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AlbumListSummaryResponse } from '../../../core/models/lists.models';
import { FollowUserResponse, UserProfileResponse } from '../../../core/models/profile.models';
import { ReviewResponse } from '../../../core/models/reviews.models';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { ListsService } from '../../../core/services/lists.service';
import { ProfileService } from '../../../core/services/profile.service';
import { ReviewsService } from '../../../core/services/reviews.service';
import { AlbumCardComponent } from '../../../shared/components/album-card/album-card.component';
import { ShareCardData, ShareCardModalComponent } from '../../../shared/components/share-card-modal/share-card-modal.component';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AlbumCardComponent, StarRatingComponent, ShareCardModalComponent],
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
          <!-- Ícone Compartilhar Perfil no Canto Superior Direito -->
          <button
            type="button"
            (click)="shareProfile()"
            class="cursor-pointer absolute top-3 right-3 z-20 w-8 h-8 rounded-lg bg-[#12161a]/90 hover:bg-[#242c34] border border-[#2a343d] hover:border-emerald-500/50 flex items-center justify-center text-gray-400 hover:text-emerald-400 transition-all shadow"
            title="Compartilhar perfil"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>

          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10 pr-6 sm:pr-8">
            
            <div class="flex items-start sm:items-center gap-5">
              <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#12161a] border-2 border-emerald-500 overflow-hidden flex items-center justify-center text-white font-black text-2xl uppercase shadow-md shrink-0">
                @if (profile.avatarUrl) {
                  <img [src]="profile.avatarUrl" [alt]="profile.username" class="w-full h-full object-cover" />
                } @else {
                  {{ (profile.displayName || profile.username).substring(0, 2) }}
                }
              </div>
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h1 class="text-2xl sm:text-3xl font-black text-white tracking-wide">
                    {{ profile.displayName || profile.username }}
                  </h1>
                  @if (profile.displayName) {
                    <span class="text-xs font-semibold text-emerald-400">&#64;{{ profile.username }}</span>
                  }
                  @if (profile.followsMe && !isOwnProfile) {
                    <span class="text-[10px] font-bold uppercase tracking-wider bg-[#242c34] text-gray-300 border border-[#323e4a] px-2 py-0.5 rounded-full">
                      Segue você
                    </span>
                  }
                </div>

                @if (profile.bio) {
                  <p class="text-xs sm:text-sm text-gray-300 mt-1.5 max-w-xl leading-relaxed whitespace-pre-wrap">
                    {{ profile.bio }}
                  </p>
                }

                <p class="text-xs text-gray-400 mt-1.5">
                  Membro desde {{ formatDate(profile.memberSince) }}
                </p>

                <!-- Pílulas de Estatísticas e Seguidores -->
                <div class="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    (click)="openFollowModal('followers')"
                    class="cursor-pointer inline-flex items-center gap-1.5 bg-[#12161a] hover:bg-[#222b33] px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 border border-[#242c34] hover:border-emerald-500/40 transition-colors"
                  >
                    <span>{{ profile.followersCount || 0 }}</span>
                    <span class="text-gray-400 font-normal">{{ (profile.followersCount || 0) === 1 ? 'seguidor' : 'seguidores' }}</span>
                  </button>

                  <button
                    type="button"
                    (click)="openFollowModal('following')"
                    class="cursor-pointer inline-flex items-center gap-1.5 bg-[#12161a] hover:bg-[#222b33] px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 border border-[#242c34] hover:border-emerald-500/40 transition-colors"
                  >
                    <span>{{ profile.followingCount || 0 }}</span>
                    <span class="text-gray-400 font-normal">seguindo</span>
                  </button>

                  <div class="inline-flex items-center gap-1.5 bg-[#12161a] px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 border border-[#242c34]">
                    <span>{{ profile.totalReviews }}</span>
                    <span class="text-gray-400 font-normal">{{ profile.totalReviews === 1 ? 'avaliação' : 'avaliações' }}</span>
                  </div>

                  <div class="inline-flex items-center gap-1.5 bg-[#12161a] px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 border border-[#242c34]">
                    <span>{{ userLists.length }}</span>
                    <span class="text-gray-400 font-normal">{{ userLists.length === 1 ? 'lista' : 'listas' }}</span>
                  </div>

                  @if (profile.spotifyProfileUrl) {
                    <a
                      [href]="profile.spotifyProfileUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1.5 bg-[#1DB954]/15 hover:bg-[#1DB954] text-[#1DB954] hover:text-black border border-[#1DB954]/30 px-3 py-1 rounded-full text-xs font-bold transition-colors"
                      title="Perfil no Spotify"
                    >
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                      <span>Spotify</span>
                    </a>
                  }

                  @if (profile.lastfmProfileUrl) {
                    <a
                      [href]="profile.lastfmProfileUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1.5 bg-red-500/15 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold transition-colors"
                      title="Perfil no Last.fm"
                    >
                      <span class="font-black text-[10px] leading-none">last.fm</span>
                    </a>
                  }
                </div>
              </div>
            </div>

            <!-- Botão de Ação (Customizar Perfil ou Seguir/Seguindo) -->
            <div class="flex flex-col items-stretch sm:items-end gap-3 shrink-0">
              @if (isOwnProfile) {
                <a
                  routerLink="/profile/me/edit"
                  class="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg transition-colors shadow-md text-center"
                >
                  Customizar Perfil
                </a>
              } @else {
                <button
                  type="button"
                  (click)="toggleFollow()"
                  [disabled]="togglingFollow"
                  class="cursor-pointer font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-lg transition-all shadow-md"
                  [ngClass]="profile.followedByMe
                    ? 'bg-[#242c34] hover:bg-red-500/20 text-gray-200 hover:text-red-400 border border-[#323e4a] hover:border-red-500/40'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black'"
                >
                  {{ profile.followedByMe ? '✓ Seguindo' : '+ Seguir' }}
                </button>
              }
            </div>
          </div>

          <!-- Card de Compatibilidade Musical (Taste Match %) quando visita outro perfil -->
          @if (authService.isAuthenticated() && !isOwnProfile) {
            <div class="mt-6 pt-5 border-t border-[#242c34] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              @if (profile.tasteMatchPercentage !== null && profile.tasteMatchPercentage !== undefined) {
                <div class="flex items-center gap-3.5">
                  <div
                    class="w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm border shrink-0 shadow"
                    [ngClass]="getTasteMatchBadgeClasses(profile.tasteMatchPercentage)"
                  >
                    {{ profile.tasteMatchPercentage }}%
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-black uppercase tracking-wider text-white">
                        Compatibilidade Musical ({{ getTasteMatchLabel(profile.tasteMatchPercentage) }})
                      </span>
                    </div>
                    <p class="text-[11px] text-gray-400 mt-0.5">
                      Calculada com base em {{ profile.commonItemsCount || 1 }} {{ (profile.commonItemsCount || 1) === 1 ? 'conexão musical (álbuns, faixas ou artistas) em comum' : 'conexões musicais (álbuns, faixas ou artistas) em comum' }}.
                    </p>
                  </div>
                </div>
                <div class="w-full sm:w-48 h-2 bg-[#12161a] rounded-full overflow-hidden border border-[#242c34] shrink-0">
                  <div
                    class="h-full transition-all duration-500"
                    [ngClass]="getTasteMatchBarClass(profile.tasteMatchPercentage)"
                    [style.width.%]="profile.tasteMatchPercentage"
                  ></div>
                </div>
              } @else {
                <div class="flex items-center gap-2.5 text-xs text-gray-400">
                  <span class="text-emerald-400 text-base">🎧</span>
                  <span>
                    <strong class="text-gray-200">Taste Match:</strong> Avalie alguns álbuns ou faixas que &#64;{{ profile.username }} ouviu para descobrir a compatibilidade musical entre vocês!
                  </span>
                </div>
              }
            </div>
          }
        </div>

        <!-- Destaques Principais: Álbum Favorito & Música do Momento -->
        @if (profile.favoriteAlbum || profile.currentTrack) {
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">

            <!-- Card: Álbum Favorito de Todos os Tempos -->
            @if (profile.favoriteAlbum) {
              <div class="flex flex-col">
                <h2 class="text-xs font-black uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-2">
                  <span>★</span> Álbum Favorito de Todos os Tempos
                </h2>
                <div class="flex-1 bg-gradient-to-r from-[#1c2228] to-[#14181c] border border-emerald-500/30 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-6 shadow-xl">
                  <div class="w-32 h-32 rounded-lg overflow-hidden shadow-2xl shrink-0 border border-[#2a343d]">
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
                    <h3 class="text-xl font-black text-white mt-1">
                      {{ profile.favoriteAlbum.title }}
                    </h3>
                    <p class="text-sm text-emerald-400 font-semibold mt-0.5">
                      {{ profile.favoriteAlbum.artist }}
                    </p>
                    <div class="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <a
                        [routerLink]="['/catalog/albums', profile.favoriteAlbum.externalId]"
                        class="inline-block text-xs font-bold text-gray-300 hover:text-white uppercase tracking-wider bg-[#242c34] hover:bg-[#2c3640] px-3.5 py-2 rounded transition-colors"
                      >
                        Ver no Catálogo →
                      </a>
                      <a
                        [href]="'https://open.spotify.com/album/' + profile.favoriteAlbum.externalId"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1.5 text-xs font-bold text-black bg-[#1DB954] hover:bg-[#1ed760] uppercase tracking-wider px-3.5 py-2 rounded transition-colors shadow"
                        title="Ouvir este álbum no Spotify"
                      >
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                        <span>Spotify</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- Card: Música do Momento (Com Player e Link do Spotify) -->
            @if (profile.currentTrack) {
              <div class="flex flex-col">
                <h2 class="text-xs font-black uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-2">
                  <span>🎧</span> Música que mais está gostando atualmente
                </h2>
                <div class="flex-1 bg-gradient-to-r from-[#1c2228] to-[#14181c] border border-emerald-500/30 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-6 shadow-xl">
                  <div class="w-32 h-32 rounded-lg overflow-hidden shadow-2xl shrink-0 border border-[#2a343d] bg-[#12161a] relative group">
                    @if (profile.currentTrack.coverUrl) {
                      <img
                        [src]="profile.currentTrack.coverUrl"
                        [alt]="profile.currentTrack.title"
                        class="w-full h-full object-cover"
                      />
                    } @else {
                      <div class="w-full h-full flex items-center justify-center text-emerald-400 text-3xl">♪</div>
                    }
                    <button
                      type="button"
                      (click)="togglePlayCurrentTrack()"
                      class="cursor-pointer absolute inset-0 bg-black/45 hover:bg-black/60 flex items-center justify-center transition-colors"
                      [title]="isPlaying ? 'Pausar música' : 'Dar Play na música'"
                    >
                      <span class="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center font-black text-base shadow-xl transition-transform group-hover:scale-105">
                        {{ isPlaying ? '❚❚' : '▶' }}
                      </span>
                    </button>
                  </div>

                  <div class="flex-1 w-full text-center sm:text-left">
                    <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <div class="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        <span>{{ isPlaying ? 'Tocando Agora' : 'Na vitrola de ' + profile.username }}</span>
                      </div>

                      <a
                        [href]="getTrackSpotifyUrl()"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1 bg-[#1DB954]/15 hover:bg-[#1DB954] text-[#1DB954] hover:text-black border border-[#1DB954]/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors"
                        title="Ouvir esta música no Spotify"
                      >
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                        <span>Spotify</span>
                      </a>
                    </div>

                    <h3 class="text-xl font-black text-white mt-1.5 truncate">
                      {{ profile.currentTrack.title }}
                    </h3>
                    <p class="text-sm text-emerald-400 font-semibold mt-0.5 truncate">
                      {{ profile.currentTrack.artist }}
                    </p>
                    @if (profile.currentTrack.albumTitle) {
                      <p class="text-xs text-gray-400 truncate mt-0.5">
                        Álbum: {{ profile.currentTrack.albumTitle }}
                      </p>
                    }

                    <!-- Controles do Player -->
                    <div class="mt-4 flex items-center gap-3">
                      <button
                        type="button"
                        (click)="togglePlayCurrentTrack()"
                        [disabled]="loadingAudio"
                        class="cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-full transition-colors shadow flex items-center gap-1.5 shrink-0"
                      >
                        <span>{{ isPlaying ? '❚❚ Pausar' : '▶ Ouvir' }}</span>
                      </button>

                      <div class="flex-1">
                        <div class="w-full h-1.5 bg-[#12161a] rounded-full overflow-hidden border border-[#242c34]">
                          <div
                            class="h-full bg-emerald-400 transition-all duration-150"
                            [style.width.%]="audioProgressPercent"
                          ></div>
                        </div>
                        <div class="flex justify-between text-[10px] font-mono text-gray-500 mt-1">
                          <span>{{ formatSeconds(currentTimeSec) }}</span>
                          <span>{{ formatSeconds(durationSec || 30) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }

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
                  <app-album-card [album]="item.album" [showSpotifyLink]="true" />
                </div>
              }
            </div>
          } @else {
            <div class="p-8 border border-dashed border-[#2a343d] rounded-lg text-center text-xs text-gray-500">
              Nenhum álbum adicionado aos favoritos ainda.
            </div>
          }
        </div>

        <!-- Seção: Listas de Álbuns do Usuário -->
        <div class="mb-12">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xs font-black uppercase tracking-widest text-gray-300">
              Listas de Álbuns de {{ profile.username }} ({{ userLists.length }})
            </h2>
            @if (isOwnProfile) {
              <a
                routerLink="/lists/new"
                class="text-xs font-bold text-emerald-400 hover:underline uppercase tracking-wider"
              >
                + Nova Lista
              </a>
            }
          </div>

          @if (userLists.length > 0) {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              @for (lst of userLists; track lst.id) {
                <a
                  [routerLink]="['/lists', lst.id]"
                  class="group bg-[#1b2228] border border-[#2a343d] hover:border-emerald-500/50 rounded-xl p-4 flex flex-col justify-between transition-all hover:-translate-y-1 shadow-md"
                >
                  <div>
                    <div class="grid grid-cols-4 gap-1.5 mb-3 bg-[#12161a] p-1.5 rounded-lg border border-[#242c34]">
                      @for (slot of [0, 1, 2, 3]; track slot) {
                        <div class="aspect-square rounded overflow-hidden bg-[#181e24]">
                          @if (lst.previewCovers[slot]) {
                            <img [src]="lst.previewCovers[slot]" [alt]="lst.title" class="w-full h-full object-cover" loading="lazy" />
                          } @else {
                            <div class="w-full h-full flex items-center justify-center text-gray-700 text-xs">♪</div>
                          }
                        </div>
                      }
                    </div>
                    <h3 class="text-base font-black text-white group-hover:text-emerald-400 transition-colors truncate">
                      {{ lst.title }}
                    </h3>
                    @if (lst.description) {
                      <p class="text-xs text-gray-400 mt-1 line-clamp-2">{{ lst.description }}</p>
                    }
                  </div>
                  <div class="flex items-center justify-between mt-3 pt-2.5 border-t border-[#242c34] text-[11px] text-gray-400">
                    <span>{{ lst.albumCount }} {{ lst.albumCount === 1 ? 'álbum' : 'álbuns' }}</span>
                    <div class="flex items-center gap-3">
                      <span><span class="text-rose-400">♥</span> {{ lst.likesCount }}</span>
                      <span>💬 {{ lst.commentsCount }}</span>
                    </div>
                  </div>
                </a>
              }
            </div>
          } @else {
            <div class="p-8 border border-dashed border-[#2a343d] rounded-lg text-center text-xs text-gray-500">
              <span>Nenhuma lista criada ainda.</span>
              @if (isOwnProfile) {
                <a routerLink="/lists/new" class="block mt-2 text-emerald-400 font-bold hover:underline">
                  + Criar minha primeira lista de álbuns
                </a>
              }
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
                <div
                  (click)="openReview(rev)"
                  class="cursor-pointer group/rev bg-[#1b2228] border border-[#2a343d] hover:border-emerald-500/50 hover:bg-[#1e262d] rounded-lg p-5 flex flex-col sm:flex-row gap-5 items-start transition-all"
                >
                  @if (rev.albumCoverUrl) {
                    <a
                      [routerLink]="['/catalog/albums', rev.albumExternalId]"
                      (click)="$event.stopPropagation()"
                      class="shrink-0"
                    >
                      <img [src]="rev.albumCoverUrl" [alt]="rev.albumTitle" class="w-16 h-16 rounded object-cover shadow border border-[#2a343d]" />
                    </a>
                  }
                  <div class="flex-1 w-full">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="font-bold text-sm text-gray-100 group-hover/rev:text-emerald-400 transition-colors">
                          {{ rev.albumTitle }}
                        </span>
                        <span class="text-xs text-gray-400">por {{ rev.albumArtist }}</span>
                        @if (rev.trackNumber !== null) {
                          <span class="text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            🎵 Faixa #{{ rev.trackNumber }} • {{ rev.trackTitle }}
                          </span>
                        } @else {
                          <span class="text-[10px] font-semibold bg-[#12161a] text-gray-400 border border-[#242c34] px-2 py-0.5 rounded-full">
                            💿 Álbum
                          </span>
                        }
                      </div>
                      <app-star-rating [rating]="rev.rating" [readonly]="true" />
                    </div>

                    @if (rev.reviewText) {
                      <p class="text-xs text-gray-300 leading-relaxed mt-2 whitespace-pre-wrap">
                        {{ rev.reviewText }}
                      </p>
                    }

                    <div class="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-[#242c34]/60">
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

                        <span class="text-[10px] text-gray-500 ml-1">
                          • {{ formatDate(rev.createdAt) }}
                        </span>
                      </div>

                      <div class="flex items-center gap-3">
                        <a
                          [href]="'https://open.spotify.com/album/' + rev.albumExternalId"
                          target="_blank"
                          rel="noopener noreferrer"
                          (click)="$event.stopPropagation()"
                          class="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1DB954] hover:underline"
                          title="Abrir no Spotify"
                        >
                          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                          </svg>
                          <span>Spotify</span>
                        </a>

                        <button
                          type="button"
                          (click)="shareReview(rev, $event)"
                          class="cursor-pointer inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-emerald-400 transition-colors"
                          title="Copiar link de compartilhamento desta review"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          <span>{{ copiedReviewId === rev.id ? 'Link copiado! ✓' : 'Compartilhar' }}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="p-8 border border-dashed border-[#2a343d] rounded-lg text-center text-xs text-gray-500">
              Este usuário ainda não avaliou nenhum álbum ou música.
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

      <!-- Modal de Seguidores / Seguindo -->
      @if (followModalOpen) {
        <div
          class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          (click)="followModalOpen = false"
        >
          <div
            class="bg-[#1b2228] border border-[#2a343d] rounded-2xl max-w-md w-full p-5 shadow-2xl animate-dropdown"
            (click)="$event.stopPropagation()"
          >
            <div class="flex items-center justify-between pb-3 mb-4 border-b border-[#242c34]">
              <h3 class="text-sm font-black uppercase tracking-wider text-white">
                {{ followModalTab === 'followers' ? 'Seguidores' : 'Seguindo' }} de &#64;{{ profile?.username }}
              </h3>
              <button
                type="button"
                (click)="followModalOpen = false"
                class="cursor-pointer text-gray-400 hover:text-white text-sm px-2 py-0.5 rounded"
              >
                ✕
              </button>
            </div>

            <div class="max-h-80 overflow-y-auto divide-y divide-[#242c34]">
              @if (loadingFollowList) {
                <div class="py-8 text-center text-xs text-gray-400">Carregando...</div>
              } @else if (followUsersList.length > 0) {
                @for (u of followUsersList; track u.username) {
                  <div class="py-3 flex items-center justify-between gap-3">
                    <a
                      [routerLink]="['/profile', u.username]"
                      (click)="followModalOpen = false"
                      class="flex items-center gap-3 min-w-0 group"
                    >
                      <div class="w-9 h-9 rounded-full bg-[#12161a] border border-emerald-500/60 overflow-hidden flex items-center justify-center text-xs font-black text-white uppercase shrink-0">
                        @if (u.avatarUrl) {
                          <img [src]="u.avatarUrl" [alt]="u.username" class="w-full h-full object-cover" />
                        } @else {
                          {{ (u.displayName || u.username).substring(0, 2) }}
                        }
                      </div>
                      <div class="min-w-0">
                        <p class="text-xs font-bold text-white group-hover:text-emerald-400 truncate">
                          {{ u.displayName || u.username }}
                        </p>
                        <p class="text-[11px] text-gray-400 truncate">&#64;{{ u.username }}</p>
                      </div>
                    </a>

                    @if (authService.isAuthenticated() && authService.currentUser()?.toLowerCase() !== u.username.toLowerCase()) {
                      <button
                        type="button"
                        (click)="toggleFollowUserInModal(u)"
                        class="cursor-pointer text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded transition-colors shrink-0"
                        [ngClass]="u.followedByMe
                          ? 'bg-[#242c34] text-gray-300 hover:text-red-400 border border-[#323e4a]'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-black'"
                      >
                        {{ u.followedByMe ? 'Seguindo' : 'Seguir' }}
                      </button>
                    }
                  </div>
                }
              } @else {
                <div class="py-8 text-center text-xs text-gray-500">
                  {{ followModalTab === 'followers' ? 'Nenhum seguidor ainda.' : 'Ainda não segue ninguém.' }}
                </div>
              }
            </div>
          </div>
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
export class ProfileViewComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private reviewsService = inject(ReviewsService);
  private listsService = inject(ListsService);
  private catalogService = inject(CatalogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private titleService = inject(Title);
  private metaService = inject(Meta);

  profile: UserProfileResponse | null = null;
  userReviews: ReviewResponse[] = [];
  userLists: AlbumListSummaryResponse[] = [];
  loading = true;
  togglingFollow = false;

  followModalOpen = false;
  followModalTab: 'followers' | 'following' = 'followers';
  followUsersList: FollowUserResponse[] = [];
  loadingFollowList = false;

  openCommentsMap: Record<string, boolean> = {};
  commentInputs: Record<string, string> = {};

  copiedProfileLink = false;
  copiedReviewId: string | null = null;
  shareModalOpen = false;
  shareCardData: ShareCardData | null = null;

  private audioPlayer: HTMLAudioElement | null = null;
  isPlaying = false;
  loadingAudio = false;
  currentTimeSec = 0;
  durationSec = 30;

  get isOwnProfile(): boolean {
    return !!this.profile && this.authService.currentUser()?.toLowerCase() === this.profile.username.toLowerCase();
  }

  get audioProgressPercent(): number {
    if (!this.durationSec) return 0;
    return Math.min(100, (this.currentTimeSec / this.durationSec) * 100);
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const username = params.get('username');
      if (username) {
        this.stopAudio();
        this.followModalOpen = false;
        this.loadProfile(username);
      }
    });
  }

  ngOnDestroy(): void {
    this.stopAudio();
  }

  loadProfile(username: string): void {
    this.loading = true;
    this.profileService.getProfile(username).subscribe({
      next: (data) => {
        this.profile = data;
        this.updateMetaTags(data);
        this.loadLists(username);
        this.loadReviews(username);
      },
      error: () => {
        this.profile = null;
        this.loading = false;
      }
    });
  }

  toggleFollow(): void {
    if (!this.profile) return;
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.togglingFollow = true;
    this.profileService.toggleFollow(this.profile.username).subscribe({
      next: (updated) => {
        this.profile = updated;
        this.togglingFollow = false;
      },
      error: () => {
        this.togglingFollow = false;
      }
    });
  }

  openFollowModal(tab: 'followers' | 'following'): void {
    if (!this.profile) return;
    this.followModalTab = tab;
    this.followModalOpen = true;
    this.loadingFollowList = true;
    this.followUsersList = [];

    const req$ = tab === 'followers'
      ? this.profileService.getFollowers(this.profile.username)
      : this.profileService.getFollowing(this.profile.username);

    req$.subscribe({
      next: (users) => {
        this.followUsersList = users || [];
        this.loadingFollowList = false;
      },
      error: () => {
        this.followUsersList = [];
        this.loadingFollowList = false;
      }
    });
  }

  toggleFollowUserInModal(u: FollowUserResponse): void {
    this.profileService.toggleFollow(u.username).subscribe({
      next: () => {
        u.followedByMe = !u.followedByMe;
        if (this.profile && this.isOwnProfile) {
          this.loadProfile(this.profile.username);
        }
      }
    });
  }

  getTasteMatchLabel(pct: number): string {
    if (pct >= 85) return 'Almas Gêmeas Sonoras 🔥';
    if (pct >= 70) return 'Sintonia Alta ✨';
    if (pct >= 50) return 'Boa Sintonia 🎧';
    return 'Gostos Diferentes 🎲';
  }

  getTasteMatchBadgeClasses(pct: number): string {
    if (pct >= 75) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    if (pct >= 50) return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    return 'bg-sky-500/20 text-sky-400 border-sky-500/40';
  }

  getTasteMatchBarClass(pct: number): string {
    if (pct >= 75) return 'bg-emerald-400';
    if (pct >= 50) return 'bg-amber-400';
    return 'bg-sky-400';
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

  private updateMetaTags(profile: UserProfileResponse): void {
    const title = `@${profile.username} no Muly (${profile.totalReviews} avaliações)`;
    const desc = profile.favoriteAlbum
      ? `Álbum favorito: ${profile.favoriteAlbum.title} (${profile.favoriteAlbum.artist}) • Confira o perfil musical de @${profile.username} no Muly.`
      : `Confira o perfil musical, avaliações e listas de @${profile.username} no Muly.`;
    const img = profile.favoriteAlbum?.coverUrl || profile.topAlbums?.[0]?.album?.coverUrl || 'https://muly.xyz/logo-emerald.png';

    this.titleService.setTitle(title);
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: desc });
    this.metaService.updateTag({ property: 'og:image', content: img });
  }

  loadLists(username: string): void {
    this.listsService.getListsByUser(username).subscribe({
      next: (lists) => {
        this.userLists = lists;
      },
      error: () => {
        this.userLists = [];
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

  getTrackSpotifyUrl(): string {
    if (!this.profile?.currentTrack) return 'https://open.spotify.com';
    if (this.profile.currentTrack.spotifyUrl) {
      return this.profile.currentTrack.spotifyUrl;
    }
    const q = `${this.profile.currentTrack.title} ${this.profile.currentTrack.artist || ''}`.trim();
    return `https://open.spotify.com/search/${encodeURIComponent(q)}`;
  }

  shareProfile(): void {
    if (!this.profile) return;
    const url = `${window.location.origin}/profile/${this.profile.username}`;
    navigator.clipboard?.writeText(url);
    this.copiedProfileLink = true;

    const topCovers = (this.profile.topAlbums || [])
      .map(t => t.album.coverUrl)
      .filter((c): c is string => !!c);

    this.shareCardData = {
      type: 'profile',
      url,
      title: this.profile.displayName ? `${this.profile.displayName} (@${this.profile.username})` : `@${this.profile.username}`,
      subtitle: this.profile.favoriteAlbum
        ? `★ ${this.profile.favoriteAlbum.title} — ${this.profile.favoriteAlbum.artist}`
        : 'Perfil Musical no Muly',
      username: this.profile.username,
      coverUrl: this.profile.favoriteAlbum?.coverUrl || this.profile.avatarUrl || null,
      gridCovers: topCovers.length >= 2 ? topCovers : undefined,
      reviewText: this.profile.bio
        ? this.profile.bio
        : (this.profile.currentTrack
          ? `Ouvindo agora: ${this.profile.currentTrack.title} (${this.profile.currentTrack.artist || ''})`
          : null),
      statsText: `${this.profile.totalReviews} ${this.profile.totalReviews === 1 ? 'avaliação publicada' : 'avaliações publicadas'} • ${this.userLists.length} ${this.userLists.length === 1 ? 'lista' : 'listas'}`
    };
    this.shareModalOpen = true;

    setTimeout(() => {
      this.copiedProfileLink = false;
    }, 2500);
  }

  shareReview(rev: ReviewResponse, event?: Event): void {
    event?.stopPropagation();
    const url = `${window.location.origin}/reviews/${rev.id}`;
    navigator.clipboard?.writeText(url);
    this.copiedReviewId = rev.id;

    this.shareCardData = {
      type: 'review',
      url,
      title: rev.albumTitle,
      subtitle: rev.albumArtist,
      username: rev.username,
      rating: rev.rating,
      reviewText: rev.reviewText,
      trackBadge: rev.trackNumber !== null ? `Faixa #${rev.trackNumber} • ${rev.trackTitle}` : null,
      coverUrl: rev.albumCoverUrl
    };
    this.shareModalOpen = true;

    setTimeout(() => {
      if (this.copiedReviewId === rev.id) {
        this.copiedReviewId = null;
      }
    }, 2500);
  }

  togglePlayCurrentTrack(): void {
    if (!this.profile?.currentTrack) return;

    if (this.isPlaying && this.audioPlayer) {
      this.audioPlayer.pause();
      this.isPlaying = false;
      return;
    }

    if (this.audioPlayer && this.audioPlayer.src) {
      this.audioPlayer.play().then(() => {
        this.isPlaying = true;
      }).catch(() => {
        this.resolveAndPlayFallback();
      });
      return;
    }

    const previewUrl = this.profile.currentTrack.previewUrl;
    if (previewUrl) {
      this.startAudioStream(previewUrl, true);
    } else {
      this.resolveAndPlayFallback();
    }
  }

  private startAudioStream(url: string, allowFallback: boolean): void {
    this.stopAudio();
    this.audioPlayer = new Audio(url);
    this.audioPlayer.volume = 0.75;

    this.audioPlayer.ontimeupdate = () => {
      if (this.audioPlayer) {
        this.currentTimeSec = Math.floor(this.audioPlayer.currentTime);
        if (this.audioPlayer.duration && !isNaN(this.audioPlayer.duration)) {
          this.durationSec = Math.floor(this.audioPlayer.duration);
        }
      }
    };

    this.audioPlayer.onended = () => {
      this.isPlaying = false;
      this.currentTimeSec = 0;
    };

    this.audioPlayer.onerror = () => {
      this.isPlaying = false;
      if (allowFallback) {
        this.resolveAndPlayFallback();
      }
    };

    this.audioPlayer.play().then(() => {
      this.isPlaying = true;
    }).catch(() => {
      this.isPlaying = false;
      if (allowFallback) {
        this.resolveAndPlayFallback();
      }
    });
  }

  private resolveAndPlayFallback(): void {
    if (!this.profile?.currentTrack) return;
    this.loadingAudio = true;
    const q = `${this.profile.currentTrack.title} ${this.profile.currentTrack.artist || ''}`.trim();
    this.catalogService.searchTracksItunesDirect(q).subscribe({
      next: (results) => {
        this.loadingAudio = false;
        if (results.length > 0 && results[0].previewUrl) {
          this.startAudioStream(results[0].previewUrl, false);
        }
      },
      error: () => {
        this.loadingAudio = false;
      }
    });
  }

  private stopAudio(): void {
    if (this.audioPlayer) {
      this.audioPlayer.pause();
      this.audioPlayer.currentTime = 0;
      this.audioPlayer = null;
    }
    this.isPlaying = false;
    this.currentTimeSec = 0;
  }

  formatSeconds(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  }
}
