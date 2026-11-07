import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AlbumListSummaryResponse } from '../../../core/models/lists.models';
import { AuthService } from '../../../core/services/auth.service';
import { ListsService } from '../../../core/services/lists.service';

@Component({
  selector: 'app-lists-browse',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#242c34]">
        <div>
          <span class="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            Curadoria da Comunidade
          </span>
          <h1 class="text-3xl font-black text-white tracking-tight mt-2">
            Listas de Álbuns
          </h1>
          <p class="text-xs sm:text-sm text-gray-400 mt-1">
            Explore coleções temáticas, discografias comentadas e seleções criadas pelos membros.
          </p>
        </div>

        @if (authService.isAuthenticated()) {
          <a
            routerLink="/lists/new"
            class="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider px-5 py-3 rounded-lg transition-colors shadow-lg shrink-0 w-fit"
          >
            <span class="text-base leading-none">+</span> Criar Nova Lista
          </a>
        } @else {
          <a
            routerLink="/login"
            class="inline-flex items-center gap-2 bg-[#1b2228] hover:bg-[#242c34] text-emerald-400 border border-emerald-500/30 font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-lg transition-colors shrink-0 w-fit"
          >
            Entre para criar uma lista
          </a>
        }
      </div>

      <!-- Barra de Busca de Listas -->
      <form (ngSubmit)="searchLists()" class="mb-8 max-w-lg flex gap-2">
        <input
          type="text"
          name="query"
          [(ngModel)]="query"
          (input)="onQueryChange()"
          placeholder="Buscar listas por título (ex: Rock, Pink, Anos 90, Favoritos)..."
          class="flex-1 bg-[#1b2228] border border-[#2a343d] rounded-lg px-4 py-2.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          class="cursor-pointer bg-[#242c34] hover:bg-[#2e3842] text-gray-200 font-bold px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-colors"
        >
          Filtrar
        </button>
      </form>

      @if (loading) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (s of [1, 2, 3, 4, 5, 6]; track s) {
            <div class="bg-[#1b2228] border border-[#2a343d] rounded-xl p-4 space-y-3">
              <div class="grid grid-cols-4 gap-1.5">
                @for (c of [1, 2, 3, 4]; track c) {
                  <div class="aspect-square rounded skeleton-shimmer"></div>
                }
              </div>
              <div class="h-4 w-2/3 rounded skeleton-shimmer"></div>
              <div class="h-3 w-1/2 rounded skeleton-shimmer"></div>
            </div>
          }
        </div>
      } @else if (lists.length > 0) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (list of lists; track list.id) {
            <a
              [routerLink]="['/lists', list.id]"
              class="group bg-[#1b2228] border border-[#2a343d] hover:border-emerald-500/50 rounded-xl p-4 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 shadow-lg"
            >
              <div>
                <!-- Preview Grid de 4 Capas estilo Letterboxd -->
                <div class="grid grid-cols-4 gap-1.5 mb-4 bg-[#12161a] p-1.5 rounded-lg border border-[#242c34]">
                  @for (slot of [0, 1, 2, 3]; track slot) {
                    <div class="aspect-square rounded overflow-hidden bg-[#181e24]">
                      @if (list.previewCovers[slot]) {
                        <img
                          [src]="list.previewCovers[slot]"
                          [alt]="list.title"
                          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      } @else {
                        <div class="w-full h-full flex items-center justify-center text-gray-700 text-xs">♪</div>
                      }
                    </div>
                  }
                </div>

                <!-- Autor -->
                <div class="flex items-center gap-2 mb-1.5">
                  <div class="w-5 h-5 rounded-full bg-[#12161a] border border-emerald-500/60 overflow-hidden flex items-center justify-center text-[9px] font-black text-white uppercase shrink-0">
                    @if (list.userAvatarUrl) {
                      <img [src]="list.userAvatarUrl" [alt]="list.username" class="w-full h-full object-cover" />
                    } @else {
                      {{ (list.userDisplayName || list.username).substring(0, 2) }}
                    }
                  </div>
                  <span class="text-xs font-semibold text-gray-400">{{ list.userDisplayName || list.username }}</span>
                </div>

                <!-- Título e Descrição -->
                <h2 class="text-lg font-black text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                  {{ list.title }}
                </h2>
                @if (list.description) {
                  <p class="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    {{ list.description }}
                  </p>
                }
              </div>

              <!-- Footer de Stats -->
              <div class="flex items-center justify-between mt-4 pt-3 border-t border-[#242c34] text-[11px] text-gray-400">
                <span class="font-semibold text-gray-300">
                  {{ list.albumCount }} {{ list.albumCount === 1 ? 'álbum' : 'álbuns' }}
                </span>
                <div class="flex items-center gap-3">
                  <span class="flex items-center gap-1">
                    <span class="text-rose-400">♥</span> {{ list.likesCount }}
                  </span>
                  <span class="flex items-center gap-1">
                    <span>💬</span> {{ list.commentsCount }}
                  </span>
                </div>
              </div>
            </a>
          }
        </div>
      } @else {
        <div class="text-center py-16 bg-[#1b2228] border border-dashed border-[#2a343d] rounded-xl">
          <p class="text-gray-300 font-bold text-base">Nenhuma lista encontrada</p>
          <p class="text-xs text-gray-500 mt-1">
            Seja o primeiro a montar uma lista temática de álbuns!
          </p>
          @if (authService.isAuthenticated()) {
            <a
              routerLink="/lists/new"
              class="inline-block mt-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg transition-colors"
            >
              + Criar Minha Primeira Lista
            </a>
          }
        </div>
      }
    </div>
  `
})
export class ListsBrowseComponent implements OnInit {
  authService = inject(AuthService);
  private listsService = inject(ListsService);

  lists: AlbumListSummaryResponse[] = [];
  query = '';
  loading = true;

  ngOnInit(): void {
    this.loadLists();
  }

  loadLists(): void {
    this.loading = true;
    this.listsService.getAllLists(this.query.trim()).subscribe({
      next: (data) => {
        this.lists = data;
        this.loading = false;
      },
      error: () => {
        this.lists = [];
        this.loading = false;
      }
    });
  }

  searchLists(): void {
    this.loadLists();
  }

  onQueryChange(): void {
    if (!this.query.trim()) {
      this.loadLists();
    }
  }
}
