import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AlbumResponse } from '../../../core/models/catalog.models';
import { TopAlbumItemRequest, UserProfileResponse } from '../../../core/models/profile.models';
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
          <p class="text-xs text-gray-400 mt-1">Escolha seu álbum favorito de todos os tempos e sua lista de Top 4.</p>
        </div>
        <a
          [routerLink]="['/profile', currentUsername]"
          class="text-xs font-semibold text-gray-400 hover:text-white uppercase tracking-wider transition-colors"
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

        <!-- SEÇÃO 1: Álbum Favorito -->
        <div class="bg-[#1b2228] border border-[#2a343d] rounded-xl p-6 mb-8">
          <h2 class="text-xs font-black uppercase tracking-widest text-emerald-400 mb-1">
            1. Álbum Favorito
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
              <div class="mt-2">
                <input
                  type="text"
                  [(ngModel)]="favSearchQuery"
                  (input)="onSearchFav()"
                  placeholder="Buscar no Spotify para definir favorito..."
                  class="w-full bg-[#12161a] border border-[#242c34] rounded px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />

                @if (favSearchResults.length > 0) {
                  <div class="bg-[#12161a] border border-[#2a343d] rounded mt-1 max-h-48 overflow-y-auto divide-y divide-[#242c34]">
                    @for (res of favSearchResults; track res.externalId) {
                      <div
                        (click)="selectFavorite(res)"
                        class="p-2 flex items-center gap-3 cursor-pointer hover:bg-[#202830] transition-colors"
                      >
                        <img [src]="res.coverUrl" class="w-8 h-8 rounded object-cover" />
                        <div class="truncate text-xs">
                          <span class="font-semibold text-gray-200">{{ res.title }}</span>
                          <span class="text-gray-400 ml-1">por {{ res.artist }}</span>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- SEÇÃO 2: Top 4 Álbuns -->
        <div class="bg-[#1b2228] border border-[#2a343d] rounded-xl p-6 mb-8">
          <h2 class="text-xs font-black uppercase tracking-widest text-emerald-400 mb-1">
            2. Seus 4 Álbuns do Topo
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
            <div class="mt-6 p-4 bg-[#14181c] border border-emerald-500/30 rounded-lg">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-gray-200">
                  Buscando álbum para a posição {{ activeSearchSlot }}
                </span>
                <button
                  type="button"
                  (click)="activeSearchSlot = null; slotSearchResults = []"
                  class="cursor-pointer text-xs text-gray-400 hover:text-white"
                >
                  ✕ Fechar
                </button>
              </div>

              <input
                type="text"
                [(ngModel)]="slotQuery"
                (input)="onSearchSlot()"
                placeholder="Nome do álbum..."
                class="w-full bg-[#1b2228] border border-[#2a343d] rounded px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />

              @if (slotSearchResults.length > 0) {
                <div class="mt-2 max-h-48 overflow-y-auto divide-y divide-[#242c34] bg-[#1b2228] border border-[#2a343d] rounded">
                  @for (res of slotSearchResults; track res.externalId) {
                    <div
                      (click)="selectSlotAlbum(res)"
                      class="p-2 flex items-center gap-3 cursor-pointer hover:bg-[#202830] transition-colors"
                    >
                      <img [src]="res.coverUrl" class="w-8 h-8 rounded object-cover" />
                      <div class="truncate text-xs">
                        <span class="font-semibold text-gray-200">{{ res.title }}</span>
                        <span class="text-gray-400 ml-1">por {{ res.artist }}</span>
                      </div>
                    </div>
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
            [disabled]="saving"
            class="cursor-pointer disabled:cursor-not-allowed bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black uppercase tracking-wider text-xs px-6 py-3 rounded-lg transition-colors shadow-lg"
          >
            {{ saving ? 'Salvando...' : 'Salvar Alterações' }}
          </button>
        </div>

      }

    </div>
  `
})
export class ProfileEditComponent implements OnInit {
  private profileService = inject(ProfileService);
  private catalogService = inject(CatalogService);
  private router = inject(Router);

  currentUsername = '';
  loading = true;
  saving = false;
  successMessage = '';
  errorMessage = '';

  favoriteAlbum: AlbumResponse | null = null;
  favSearchQuery = '';
  favSearchResults: AlbumResponse[] = [];

  topSlots: TopSlot[] = [
    { position: 1, album: null },
    { position: 2, album: null },
    { position: 3, album: null },
    { position: 4, album: null }
  ];

  activeSearchSlot: number | null = null;
  slotQuery = '';
  slotSearchResults: AlbumResponse[] = [];

  ngOnInit(): void {
    this.profileService.getMyProfile().subscribe({
      next: (profile: UserProfileResponse) => {
        this.currentUsername = profile.username;
        this.favoriteAlbum = profile.favoriteAlbum;
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

  onSearchFav(): void {
    if (this.favSearchQuery.trim().length > 1) {
      this.catalogService.search(this.favSearchQuery.trim()).subscribe({
        next: (res) => (this.favSearchResults = res)
      });
    } else {
      this.favSearchResults = [];
    }
  }

  selectFavorite(album: AlbumResponse): void {
    this.favoriteAlbum = album;
    this.favSearchQuery = '';
    this.favSearchResults = [];
  }

  openSlotSearch(position: number): void {
    this.activeSearchSlot = position;
    this.slotQuery = '';
    this.slotSearchResults = [];
  }

  onSearchSlot(): void {
    if (this.slotQuery.trim().length > 1) {
      this.catalogService.search(this.slotQuery.trim()).subscribe({
        next: (res) => (this.slotSearchResults = res)
      });
    } else {
      this.slotSearchResults = [];
    }
  }

  selectSlotAlbum(album: AlbumResponse): void {
    if (this.activeSearchSlot !== null) {
      const slot = this.topSlots.find(s => s.position === this.activeSearchSlot);
      if (slot) {
        slot.album = album;
      }
      this.activeSearchSlot = null;
      this.slotQuery = '';
      this.slotSearchResults = [];
    }
  }

  saveProfileChanges(): void {
    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';

    // 1. Atualizar Álbum Favorito
    const favSpotifyId = this.favoriteAlbum ? this.favoriteAlbum.externalId : null;
    this.profileService.setFavoriteAlbum(favSpotifyId).subscribe({
      next: () => {
        // 2. Atualizar Top Álbuns
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
            }, 1000);
          },
          error: (err) => {
            this.saving = false;
            this.errorMessage = err.error?.message || 'Erro ao atualizar Top Álbuns.';
          }
        });
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err.error?.message || 'Erro ao atualizar Álbum Favorito.';
      }
    });
  }
}
