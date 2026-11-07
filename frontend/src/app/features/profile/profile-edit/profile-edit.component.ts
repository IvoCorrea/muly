import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AlbumResponse, TrackSearchResponse } from '../../../core/models/catalog.models';
import { CurrentTrackResponse, TopAlbumItemRequest, UserProfileResponse } from '../../../core/models/profile.models';
import { CatalogService } from '../../../core/services/catalog.service';
import { ProfileService } from '../../../core/services/profile.service';

interface TopSlot {
  position: number;
  album: AlbumResponse | null;
}

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8">
      
      <div class="flex items-center justify-between mb-8 pb-4 border-b border-[#242c34]">
        <div>
          <h1 class="text-2xl font-black text-white uppercase tracking-wider">Customizar Perfil</h1>
          <p class="text-xs text-gray-400 mt-1">Personalize sua foto, bio, links sociais, álbum favorito, música do momento e seu Top 4.</p>
        </div>
        <a
          [routerLink]="['/profile', currentUsername]"
          class="text-xs font-semibold text-gray-400 hover:text-white uppercase tracking-wider transition-colors shrink-0"
        >
          ← Voltar ao perfil
        </a>
      </div>

      @if (loading) {
        <div class="flex justify-center py-20 text-emerald-400">
          <svg class="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
        </div>
      } @else {

        <!-- SEÇÃO 1: Foto de Perfil (ImageKit), Nome de Exibição, Bio & Redes Sociais -->
        <div class="bg-[#1b2228] border border-[#2a343d] rounded-xl p-6 mb-8">
          <div class="flex items-center justify-between mb-1">
            <h2 class="text-xs font-black uppercase tracking-widest text-emerald-400">
              1. Identidade, Foto & Redes Sociais
            </h2>
            <span class="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              ImageKit CDN
            </span>
          </div>
          <p class="text-xs text-gray-400 mb-6">
            Adicione uma foto de perfil, seu nome de exibição, uma bio curta e links para seus perfis musicais.
          </p>

          <!-- Upload de Avatar -->
          <div class="flex flex-col sm:flex-row items-center gap-6 pb-6 mb-6 border-b border-[#242c34]">
            <div class="relative w-24 h-24 rounded-full bg-[#12161a] border-2 border-emerald-500 overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
              @if (avatarUrl) {
                <img [src]="avatarUrl" alt="Foto de perfil" class="w-full h-full object-cover" />
              } @else {
                <span class="text-white font-black text-2xl uppercase">
                  {{ (displayName || currentUsername).substring(0, 2) }}
                </span>
              }
              @if (uploadingAvatar) {
                <div class="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <svg class="animate-spin h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                </div>
              }
            </div>

            <div class="flex-1 text-center sm:text-left">
              <h3 class="text-sm font-bold text-white">Foto de Perfil</h3>
              <p class="text-xs text-gray-400 mt-0.5">
                JPG, PNG ou WebP. A imagem é recortada em quadrado automaticamente.
              </p>

              <input
                #avatarFileInput
                type="file"
                accept="image/*"
                class="hidden"
                (change)="onAvatarFileSelected($event)"
              />

              <div class="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <button
                  type="button"
                  (click)="avatarFileInput.click()"
                  [disabled]="uploadingAvatar"
                  class="cursor-pointer disabled:opacity-50 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg transition-colors shadow"
                >
                  {{ uploadingAvatar ? 'Enviando...' : (avatarUrl ? 'Trocar Foto' : 'Escolher Foto') }}
                </button>

                @if (avatarUrl && !uploadingAvatar) {
                  <button
                    type="button"
                    (click)="removeAvatar()"
                    class="cursor-pointer text-xs text-red-400 hover:text-red-300 underline"
                  >
                    Remover foto
                  </button>
                }
              </div>

              @if (avatarError) {
                <p class="text-xs text-red-400 mt-2">{{ avatarError }}</p>
              }
            </div>
          </div>

          <!-- Nome de Exibição & Bio -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Nome de Exibição
              </label>
              <input
                type="text"
                [(ngModel)]="displayName"
                maxlength="50"
                placeholder="Ex: {{ currentUsername }}"
                class="w-full bg-[#12161a] border border-[#242c34] rounded-lg px-3.5 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
              <span class="text-[10px] text-gray-500 mt-1 block">
                Seu identificador único continua sendo <strong class="text-gray-400">&#64;{{ currentUsername }}</strong>
              </span>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Bio / Status Curto
                </label>
                <span class="text-[10px] text-gray-500">{{ bio.length }}/160</span>
              </div>
              <textarea
                [(ngModel)]="bio"
                maxlength="160"
                rows="2"
                placeholder="Gêneros favoritos, citação musical ou o que anda ouvindo..."
                class="w-full bg-[#12161a] border border-[#242c34] rounded-lg px-3.5 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
              ></textarea>
            </div>
          </div>

          <!-- Links Sociais Rápidos: Spotify & Last.fm -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="flex items-center gap-1.5 text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                <svg class="w-3.5 h-3.5 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                <span>Perfil do Spotify</span>
              </label>
              <input
                type="text"
                [(ngModel)]="spotifyProfileUrl"
                placeholder="Link ou usuário (ex: https://open.spotify.com/user/...)"
                class="w-full bg-[#12161a] border border-[#242c34] rounded-lg px-3.5 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label class="flex items-center gap-1.5 text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                <span class="inline-block w-3.5 h-3.5 rounded-full bg-red-500 text-white font-black text-[9px] flex items-center justify-center leading-none">as</span>
                <span>Perfil do Last.fm</span>
              </label>
              <input
                type="text"
                [(ngModel)]="lastfmProfileUrl"
                placeholder="Link ou usuário (ex: https://www.last.fm/user/...)"
                class="w-full bg-[#12161a] border border-[#242c34] rounded-lg px-3.5 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <!-- SEÇÃO 2: Álbum Favorito -->
        <div class="bg-[#1b2228] border border-[#2a343d] rounded-xl p-6 mb-8">
          <h2 class="text-xs font-black uppercase tracking-widest text-emerald-400 mb-1">
            2. Álbum Favorito
          </h2>
          <p class="text-xs text-gray-400 mb-4">A capa deste álbum fica em destaque no topo do seu perfil.</p>

          <div class="flex flex-col sm:flex-row items-center gap-6">
            <div class="w-32 h-32 rounded-lg bg-[#12161a] border border-[#2a343d] overflow-hidden flex items-center justify-center shrink-0">
              @if (favoriteAlbum) {
                <img [src]="favoriteAlbum.coverUrl" [alt]="favoriteAlbum.title" class="w-full h-full object-cover" />
              } @else {
                <span class="text-xs text-gray-600 text-center px-2">Nenhum selecionado</span>
              }
            </div>

            <div class="flex-1 w-full">
              @if (favoriteAlbum) {
                <div class="mb-3">
                  <h3 class="font-bold text-white text-sm">{{ favoriteAlbum.title }}</h3>
                  <p class="text-xs text-emerald-400 font-medium">{{ favoriteAlbum.artist }} ({{ favoriteAlbum.releaseYear }})</p>
                </div>
                <button
                  type="button"
                  (click)="favoriteAlbum = null"
                  class="cursor-pointer text-xs text-red-400 hover:text-red-300 underline"
                >
                  Remover favorito
                </button>
              }

              <!-- Busca de Álbum Favorito -->
              <div #favSearchContainer class="mt-2">
                <input
                  type="text"
                  [(ngModel)]="favSearchQuery"
                  (focus)="onFocusFav()"
                  (input)="onSearchFav()"
                  placeholder="Buscar no Spotify para definir favorito..."
                  class="w-full bg-[#12161a] border border-[#242c34] rounded px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />

                @if (showFavDropdown && (searchingFav || favSearchResults.length > 0)) {
                  <div class="animate-dropdown bg-[#12161a] border border-[#2a343d] rounded mt-1 max-h-48 overflow-y-auto divide-y divide-[#242c34] shadow-xl">
                    @if (searchingFav && favSearchResults.length === 0) {
                      @for (s of [1, 2, 3]; track s) {
                        <div class="p-2 flex items-center gap-3">
                          <div class="w-8 h-8 rounded skeleton-shimmer shrink-0"></div>
                          <div class="flex-1 space-y-1.5">
                            <div class="h-3 w-3/5 rounded skeleton-shimmer"></div>
                            <div class="h-2.5 w-2/5 rounded skeleton-shimmer"></div>
                          </div>
                        </div>
                      }
                    } @else {
                      @for (res of favSearchResults; track res.externalId) {
                        <div
                          (click)="selectFavorite(res)"
                          class="animate-search-item p-2 flex items-center gap-3 cursor-pointer hover:bg-[#202830] transition-colors"
                        >
                          <img [src]="res.coverUrl" class="w-8 h-8 rounded object-cover" />
                          <div class="truncate text-xs">
                            <span class="font-semibold text-gray-200">{{ res.title }}</span>
                            <span class="text-gray-400 ml-1">por {{ res.artist }}</span>
                          </div>
                        </div>
                      }
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- SEÇÃO 3: Música do Momento (Com Player) -->
        <div class="bg-[#1b2228] border border-[#2a343d] rounded-xl p-6 mb-8">
          <div class="flex items-center justify-between mb-1">
            <h2 class="text-xs font-black uppercase tracking-widest text-emerald-400">
              3. Música do Momento (Com Play no Perfil)
            </h2>
            <span class="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              Preview de Áudio
            </span>
          </div>
          <p class="text-xs text-gray-400 mb-4">
            Escolha a música que você mais está gostando atualmente para deixar com botão de Play no seu perfil.
          </p>

          <div class="flex flex-col sm:flex-row items-center gap-6">
            <div class="w-28 h-28 rounded-lg bg-[#12161a] border border-[#2a343d] overflow-hidden flex items-center justify-center shrink-0 relative">
              @if (currentTrack && currentTrack.coverUrl) {
                <img [src]="currentTrack.coverUrl" [alt]="currentTrack.title" class="w-full h-full object-cover" />
                @if (currentTrack.previewUrl) {
                  <button
                    type="button"
                    (click)="togglePreview(currentTrack.previewUrl)"
                    class="cursor-pointer absolute inset-0 bg-black/50 hover:bg-black/60 flex items-center justify-center transition-colors"
                    title="Testar Play/Pause"
                  >
                    <span class="w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center font-black text-sm shadow-lg">
                      {{ isPlayingPreview ? '❚❚' : '▶' }}
                    </span>
                  </button>
                }
              } @else {
                <span class="text-xs text-gray-600 text-center px-2">Nenhuma música</span>
              }
            </div>

            <div class="flex-1 w-full">
              @if (currentTrack) {
                <div class="mb-3 flex flex-wrap items-center justify-between gap-2 bg-[#12161a] border border-[#242c34] rounded-lg p-3">
                  <div class="truncate">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                      🎧 Curtindo agora
                    </span>
                    <h3 class="font-bold text-white text-sm truncate">{{ currentTrack.title }}</h3>
                    <p class="text-xs text-gray-400 truncate">
                      {{ currentTrack.artist }}
                      @if (currentTrack.albumTitle) {
                        <span>• {{ currentTrack.albumTitle }}</span>
                      }
                    </p>
                  </div>
                  <div class="flex items-center gap-3 shrink-0">
                    @if (currentTrack.previewUrl) {
                      <button
                        type="button"
                        (click)="togglePreview(currentTrack.previewUrl)"
                        class="cursor-pointer text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black px-3 py-1.5 rounded-full transition-colors"
                      >
                        {{ isPlayingPreview ? '❚❚ Pausar' : '▶ Ouvir Preview' }}
                      </button>
                    }
                    <button
                      type="button"
                      (click)="removeCurrentTrack()"
                      class="cursor-pointer text-xs text-red-400 hover:text-red-300 underline"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              }

              <!-- Busca de Música do Momento -->
              <div #trackSearchContainer class="mt-2">
                <input
                  type="text"
                  [(ngModel)]="trackSearchQuery"
                  (focus)="onFocusTrack()"
                  (input)="onSearchTrack()"
                  placeholder="Digite o nome da música ou artista (ex: Creep Radiohead, Daechwita, Daft Punk)..."
                  class="w-full bg-[#12161a] border border-[#242c34] rounded px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />

                @if (showTrackDropdown && (searchingTrack || trackSearchResults.length > 0)) {
                  <div class="animate-dropdown bg-[#12161a] border border-[#2a343d] rounded mt-1 max-h-56 overflow-y-auto divide-y divide-[#242c34] shadow-xl">
                    @if (searchingTrack && trackSearchResults.length === 0) {
                      @for (s of [1, 2, 3]; track s) {
                        <div class="p-2.5 flex items-center justify-between gap-3">
                          <div class="flex items-center gap-3 flex-1">
                            <div class="w-9 h-9 rounded skeleton-shimmer shrink-0"></div>
                            <div class="flex-1 space-y-1.5">
                              <div class="h-3 w-3/5 rounded skeleton-shimmer"></div>
                              <div class="h-2.5 w-2/5 rounded skeleton-shimmer"></div>
                            </div>
                          </div>
                          <div class="w-16 h-5 rounded skeleton-shimmer shrink-0"></div>
                        </div>
                      }
                    } @else {
                      @for (trk of trackSearchResults; track trk.title + trk.artist + trk.albumTitle) {
                        <div
                          (click)="selectCurrentTrack(trk)"
                          class="animate-search-item p-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#202830] transition-colors"
                        >
                          <div class="flex items-center gap-3 truncate">
                            @if (trk.coverUrl) {
                              <img [src]="trk.coverUrl" class="w-9 h-9 rounded object-cover shrink-0" />
                            }
                            <div class="truncate text-xs">
                              <p class="font-semibold text-gray-200 truncate">{{ trk.title }}</p>
                              <p class="text-[11px] text-gray-400 truncate">
                                {{ trk.artist }}
                                @if (trk.albumTitle) {
                                  <span class="text-gray-500">• {{ trk.albumTitle }}</span>
                                }
                              </p>
                            </div>
                          </div>
                          <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded shrink-0">
                            Selecionar
                          </span>
                        </div>
                      }
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- SEÇÃO 4: Top 4 Álbuns -->
        <div class="bg-[#1b2228] border border-[#2a343d] rounded-xl p-6 mb-8">
          <h2 class="text-xs font-black uppercase tracking-widest text-emerald-400 mb-1">
            4. Seus 4 Álbuns do Topo
          </h2>
          <p class="text-xs text-gray-400 mb-6">Escolha quatro álbuns fundamentais para exibir em destaque.</p>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            @for (slot of topSlots; track slot.position) {
              <div class="bg-[#12161a] border border-[#242c34] rounded-lg p-3 relative flex flex-col justify-between">
                <span class="absolute top-2 left-2 w-5 h-5 rounded-full bg-emerald-500 text-black font-black text-[10px] flex items-center justify-center z-10 shadow">
                  {{ slot.position }}
                </span>

                <div class="aspect-square w-full rounded bg-[#181e24] overflow-hidden mb-2 relative flex items-center justify-center">
                  @if (slot.album) {
                    <img [src]="slot.album.coverUrl" [alt]="slot.album.title" class="w-full h-full object-cover" />
                    <button
                      type="button"
                      (click)="slot.album = null"
                      class="cursor-pointer absolute top-1 right-1 bg-black/70 hover:bg-red-500 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center transition-colors"
                      title="Remover"
                    >
                      ✕
                    </button>
                  } @else {
                    <span class="text-[11px] text-gray-600 font-medium">Vazio</span>
                  }
                </div>

                <div class="truncate mb-2">
                  <p class="text-xs font-semibold text-gray-200 truncate">{{ slot.album ? slot.album.title : 'Escolha um álbum' }}</p>
                  <p class="text-[10px] text-gray-400 truncate">{{ slot.album ? slot.album.artist : 'Posição ' + slot.position }}</p>
                </div>

                <!-- Input de busca para este slot -->
                <button
                  type="button"
                  (click)="openSlotSearch(slot.position)"
                  class="cursor-pointer w-full text-center text-[11px] font-bold uppercase tracking-wider py-1.5 px-2 rounded bg-[#202830] hover:bg-[#28323c] text-emerald-400 transition-colors"
                >
                  {{ slot.album ? 'Trocar' : '+ Buscar' }}
                </button>
              </div>
            }
          </div>

          <!-- Modal de Busca de Slot -->
          @if (activeSearchSlot !== null) {
            <div #slotSearchContainer class="animate-dropdown mt-6 p-4 bg-[#14181c] border border-emerald-500/30 rounded-lg">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-gray-200">
                  Buscando álbum para a posição {{ activeSearchSlot }}
                </span>
                <button
                  type="button"
                  (click)="activeSearchSlot = null; slotSearchResults = []; searchingSlot = false; showSlotDropdown = false"
                  class="cursor-pointer text-xs text-gray-400 hover:text-white"
                >
                  ✕ Fechar
                </button>
              </div>

              <input
                type="text"
                [(ngModel)]="slotQuery"
                (focus)="onFocusSlot()"
                (input)="onSearchSlot()"
                placeholder="Nome do álbum..."
                class="w-full bg-[#1b2228] border border-[#2a343d] rounded px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />

              @if (showSlotDropdown && (searchingSlot || slotSearchResults.length > 0)) {
                <div class="animate-dropdown mt-2 max-h-48 overflow-y-auto divide-y divide-[#242c34] bg-[#1b2228] border border-[#2a343d] rounded shadow-xl">
                  @if (searchingSlot && slotSearchResults.length === 0) {
                    @for (s of [1, 2, 3]; track s) {
                      <div class="p-2 flex items-center gap-3">
                        <div class="w-8 h-8 rounded skeleton-shimmer shrink-0"></div>
                        <div class="flex-1 space-y-1.5">
                          <div class="h-3 w-3/5 rounded skeleton-shimmer"></div>
                          <div class="h-2.5 w-2/5 rounded skeleton-shimmer"></div>
                        </div>
                      </div>
                    }
                  } @else {
                    @for (res of slotSearchResults; track res.externalId) {
                      <div
                        (click)="selectSlotAlbum(res)"
                        class="animate-search-item p-2 flex items-center gap-3 cursor-pointer hover:bg-[#202830] transition-colors"
                      >
                        <img [src]="res.coverUrl" class="w-8 h-8 rounded object-cover" />
                        <div class="truncate text-xs">
                          <span class="font-semibold text-gray-200">{{ res.title }}</span>
                          <span class="text-gray-400 ml-1">por {{ res.artist }}</span>
                        </div>
                      </div>
                    }
                  }
                </div>
              }
            </div>
          }
        </div>

        @if (successMessage) {
          <div class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded p-3 mb-6">
            {{ successMessage }}
          </div>
        }

        @if (errorMessage) {
          <div class="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded p-3 mb-6">
            {{ errorMessage }}
          </div>
        }

        <!-- Botão Salvar -->
        <div class="flex justify-end gap-3">
          <button
            type="button"
            (click)="saveProfileChanges()"
            [disabled]="saving || uploadingAvatar"
            class="cursor-pointer disabled:cursor-not-allowed bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black uppercase tracking-wider text-xs px-6 py-3 rounded-lg transition-colors shadow-lg"
          >
            {{ saving ? 'Salvando...' : 'Salvar Alterações' }}
          </button>
        </div>

      }

    </div>
  `
})
export class ProfileEditComponent implements OnInit, OnDestroy {
  private profileService = inject(ProfileService);
  private catalogService = inject(CatalogService);
  private router = inject(Router);

  @ViewChild('favSearchContainer') favSearchContainer?: ElementRef<HTMLElement>;
  @ViewChild('trackSearchContainer') trackSearchContainer?: ElementRef<HTMLElement>;
  @ViewChild('slotSearchContainer') slotSearchContainer?: ElementRef<HTMLElement>;

  currentUsername = '';
  displayName = '';
  bio = '';
  avatarUrl: string | null = null;
  spotifyProfileUrl = '';
  lastfmProfileUrl = '';

  uploadingAvatar = false;
  avatarError = '';

  loading = true;
  saving = false;
  successMessage = '';
  errorMessage = '';

  favoriteAlbum: AlbumResponse | null = null;
  favSearchQuery = '';
  favSearchResults: AlbumResponse[] = [];
  searchingFav = false;
  showFavDropdown = false;

  currentTrack: CurrentTrackResponse | null = null;
  trackSearchQuery = '';
  trackSearchResults: TrackSearchResponse[] = [];
  searchingTrack = false;
  showTrackDropdown = false;

  private previewAudio: HTMLAudioElement | null = null;
  isPlayingPreview = false;

  topSlots: TopSlot[] = [
    { position: 1, album: null },
    { position: 2, album: null },
    { position: 3, album: null },
    { position: 4, album: null }
  ];

  activeSearchSlot: number | null = null;
  slotQuery = '';
  slotSearchResults: AlbumResponse[] = [];
  searchingSlot = false;
  showSlotDropdown = false;

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showFavDropdown && !this.showTrackDropdown && !this.showSlotDropdown) return;
    const target = event.target as Node;
    if (this.favSearchContainer && !this.favSearchContainer.nativeElement.contains(target)) {
      this.showFavDropdown = false;
      this.searchingFav = false;
    }
    if (this.trackSearchContainer && !this.trackSearchContainer.nativeElement.contains(target)) {
      this.showTrackDropdown = false;
      this.searchingTrack = false;
    }
    if (this.slotSearchContainer && !this.slotSearchContainer.nativeElement.contains(target)) {
      this.showSlotDropdown = false;
      this.searchingSlot = false;
    }
  }

  onFocusFav(): void {
    this.showTrackDropdown = false;
    this.showSlotDropdown = false;
    if (this.favSearchQuery.trim().length > 1) {
      this.showFavDropdown = true;
    }
  }

  onFocusTrack(): void {
    this.showFavDropdown = false;
    this.showSlotDropdown = false;
    if (this.trackSearchQuery.trim().length > 1) {
      this.showTrackDropdown = true;
    }
  }

  onFocusSlot(): void {
    this.showFavDropdown = false;
    this.showTrackDropdown = false;
    if (this.slotQuery.trim().length > 1) {
      this.showSlotDropdown = true;
    }
  }

  ngOnInit(): void {
    this.profileService.getMyProfile().subscribe({
      next: (profile: UserProfileResponse) => {
        this.currentUsername = profile.username;
        this.displayName = profile.displayName || '';
        this.bio = profile.bio || '';
        this.avatarUrl = profile.avatarUrl || null;
        this.spotifyProfileUrl = profile.spotifyProfileUrl || '';
        this.lastfmProfileUrl = profile.lastfmProfileUrl || '';
        this.favoriteAlbum = profile.favoriteAlbum;
        this.currentTrack = profile.currentTrack || null;
        if (profile.topAlbums) {
          profile.topAlbums.forEach(item => {
            const slot = this.topSlots.find(s => s.position === item.position);
            if (slot) {
              slot.album = item.album;
            }
          });
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.stopPreview();
  }

  async onAvatarFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.avatarError = 'Por favor, selecione um arquivo de imagem válido.';
      return;
    }

    this.avatarError = '';
    this.uploadingAvatar = true;

    try {
      const base64DataUrl = await this.cropAndResizeToSquareBase64(file, 400);
      this.profileService.uploadAvatar(base64DataUrl).subscribe({
        next: (updated) => {
          this.avatarUrl = updated.avatarUrl;
          this.uploadingAvatar = false;
        },
        error: (err) => {
          this.uploadingAvatar = false;
          this.avatarError = err.error?.message || 'Não foi possível enviar a foto para o ImageKit.';
        }
      });
    } catch {
      this.uploadingAvatar = false;
      this.avatarError = 'Erro ao processar a imagem selecionada.';
    }
  }

  removeAvatar(): void {
    this.avatarError = '';
    this.uploadingAvatar = true;
    this.profileService.deleteAvatar().subscribe({
      next: () => {
        this.avatarUrl = null;
        this.uploadingAvatar = false;
      },
      error: (err) => {
        this.uploadingAvatar = false;
        this.avatarError = err.error?.message || 'Não foi possível remover a foto.';
      }
    });
  }

  private cropAndResizeToSquareBase64(file: File, size: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context unavailable'));
            return;
          }

          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;

          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
          resolve(canvas.toDataURL('image/jpeg', 0.88));
        };
        img.onerror = () => reject(new Error('Invalid image'));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsDataURL(file);
    });
  }

  onSearchFav(): void {
    const q = this.favSearchQuery.trim();
    if (q.length > 1) {
      this.showFavDropdown = true;
      this.searchingFav = true;
      this.catalogService.search(q).subscribe({
        next: (res) => {
          if (this.favSearchQuery.trim() === q) {
            this.favSearchResults = res;
            this.searchingFav = false;
          }
        },
        error: () => {
          this.favSearchResults = [];
          this.searchingFav = false;
        }
      });
    } else {
      this.favSearchResults = [];
      this.searchingFav = false;
      this.showFavDropdown = false;
    }
  }

  selectFavorite(album: AlbumResponse): void {
    this.favoriteAlbum = album;
    this.favSearchQuery = '';
    this.favSearchResults = [];
    this.searchingFav = false;
    this.showFavDropdown = false;
  }

  onSearchTrack(): void {
    const q = this.trackSearchQuery.trim();
    if (q.length > 1) {
      this.showTrackDropdown = true;
      this.searchingTrack = true;
      this.catalogService.searchTracks(q).subscribe({
        next: (res) => {
          if (this.trackSearchQuery.trim() === q) {
            this.trackSearchResults = res;
            this.searchingTrack = false;
          }
        },
        error: () => {
          this.trackSearchResults = [];
          this.searchingTrack = false;
        }
      });
    } else {
      this.trackSearchResults = [];
      this.searchingTrack = false;
      this.showTrackDropdown = false;
    }
  }

  selectCurrentTrack(track: TrackSearchResponse): void {
    this.stopPreview();
    this.currentTrack = {
      title: track.title,
      artist: track.artist,
      albumTitle: track.albumTitle,
      coverUrl: track.coverUrl,
      previewUrl: track.previewUrl,
      spotifyUrl: track.spotifyUrl || null
    };
    this.trackSearchQuery = '';
    this.trackSearchResults = [];
    this.searchingTrack = false;
    this.showTrackDropdown = false;
  }

  removeCurrentTrack(): void {
    this.stopPreview();
    this.currentTrack = null;
  }

  togglePreview(previewUrl: string | null): void {
    if (!previewUrl) return;

    if (this.isPlayingPreview && this.previewAudio) {
      this.stopPreview();
      return;
    }

    this.stopPreview();
    this.previewAudio = new Audio(previewUrl);
    this.previewAudio.volume = 0.7;
    this.previewAudio.onended = () => {
      this.isPlayingPreview = false;
    };
    this.previewAudio.onerror = () => {
      this.isPlayingPreview = false;
    };
    this.previewAudio.play().then(() => {
      this.isPlayingPreview = true;
    }).catch(() => {
      this.isPlayingPreview = false;
    });
  }

  private stopPreview(): void {
    if (this.previewAudio) {
      this.previewAudio.pause();
      this.previewAudio.currentTime = 0;
      this.previewAudio = null;
    }
    this.isPlayingPreview = false;
  }

  openSlotSearch(position: number): void {
    this.activeSearchSlot = position;
    this.slotQuery = '';
    this.slotSearchResults = [];
    this.searchingSlot = false;
    this.showSlotDropdown = false;
  }

  onSearchSlot(): void {
    const q = this.slotQuery.trim();
    if (q.length > 1) {
      this.showSlotDropdown = true;
      this.searchingSlot = true;
      this.catalogService.search(q).subscribe({
        next: (res) => {
          if (this.slotQuery.trim() === q) {
            this.slotSearchResults = res;
            this.searchingSlot = false;
          }
        },
        error: () => {
          this.slotSearchResults = [];
          this.searchingSlot = false;
        }
      });
    } else {
      this.slotSearchResults = [];
      this.searchingSlot = false;
      this.showSlotDropdown = false;
    }
  }

  selectSlotAlbum(album: AlbumResponse): void {
    if (this.activeSearchSlot !== null) {
      this.topSlots.forEach(s => {
        if (s.position !== this.activeSearchSlot && s.album?.externalId === album.externalId) {
          s.album = null;
        }
      });

      const slot = this.topSlots.find(s => s.position === this.activeSearchSlot);
      if (slot) {
        slot.album = album;
      }
      this.activeSearchSlot = null;
      this.slotQuery = '';
      this.slotSearchResults = [];
      this.searchingSlot = false;
      this.showSlotDropdown = false;
    }
  }

  saveProfileChanges(): void {
    this.stopPreview();
    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';

    // 1. Atualizar Informações Básicas (DisplayName, Bio, Links Sociais)
    this.profileService.updateProfileInfo({
      displayName: this.displayName.trim() || null,
      bio: this.bio.trim() || null,
      spotifyProfileUrl: this.spotifyProfileUrl.trim() || null,
      lastfmProfileUrl: this.lastfmProfileUrl.trim() || null
    }).subscribe({
      next: () => {
        // 2. Atualizar Álbum Favorito
        const favSpotifyId = this.favoriteAlbum ? this.favoriteAlbum.externalId : null;
        this.profileService.setFavoriteAlbum(favSpotifyId).subscribe({
          next: () => {
            // 3. Atualizar Música do Momento
            const trackPayload = this.currentTrack
              ? {
                  title: this.currentTrack.title,
                  artist: this.currentTrack.artist,
                  albumTitle: this.currentTrack.albumTitle,
                  coverUrl: this.currentTrack.coverUrl,
                  previewUrl: this.currentTrack.previewUrl,
                  spotifyUrl: this.currentTrack.spotifyUrl || null
                }
              : { title: null };

            this.profileService.setCurrentTrack(trackPayload).subscribe({
              next: () => {
                // 4. Atualizar Top Álbuns
                const topItems: TopAlbumItemRequest[] = this.topSlots
                  .filter(s => s.album !== null)
                  .map(s => ({
                    position: s.position,
                    spotifyId: s.album!.externalId
                  }));

                this.profileService.updateTopAlbums({ topAlbums: topItems }).subscribe({
                  next: () => {
                    this.saving = false;
                    this.successMessage = 'Perfil atualizado com sucesso!';
                    setTimeout(() => {
                      this.router.navigate(['/profile', this.currentUsername]);
                    }, 900);
                  },
                  error: (err) => {
                    this.saving = false;
                    this.errorMessage = err.error?.message || 'Erro ao atualizar Top Álbuns.';
                  }
                });
              },
              error: (err) => {
                this.saving = false;
                this.errorMessage = err.error?.message || 'Erro ao atualizar Música do Momento.';
              }
            });
          },
          error: (err) => {
            this.saving = false;
            this.errorMessage = err.error?.message || 'Erro ao atualizar Álbum Favorito.';
          }
        });
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err.error?.message || 'Erro ao atualizar informações do perfil.';
      }
    });
  }
}
