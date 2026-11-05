import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AlbumResponse } from '../../core/models/catalog.models';
import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '../../core/services/catalog.service';
import { AlbumCardComponent } from '../../shared/components/album-card/album-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AlbumCardComponent],
  template: `
    <div>
      <!-- Hero Section -->
      <section class="py-16 sm:py-24 px-4 text-center border-b border-[#242c34] bg-gradient-to-b from-[#181e24] to-[#14181c]">
        <div class="max-w-3xl mx-auto">
          <span class="inline-block text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full mb-4">
            A rede social para quem ama música
          </span>
          <h1 class="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Catalogue o que você ouve. Compartilhe o que você sente.
          </h1>
          <p class="text-sm sm:text-base text-gray-400 mt-4 leading-relaxed max-w-xl mx-auto">
            Registre suas audições, monte listas temáticas e descubra o que seus amigos andam ouvindo.
          </p>

          <!-- Input de Busca Rápida com Autocomplete em Tempo Real -->
          <div class="mt-8 max-w-md mx-auto relative text-left">
            <form (ngSubmit)="search()" class="flex gap-2">
              <input
                type="text"
                name="searchQuery"
                [(ngModel)]="searchQuery"
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

            @if (searchingLive || liveResults.length > 0) {
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

      <!-- Álbuns em Destaque / Clássicos -->
      <section class="max-w-6xl mx-auto px-4 py-12">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xs font-black uppercase tracking-widest text-gray-300">
            Destaques da Comunidade
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
  private router = inject(Router);

  searchQuery = '';
  liveResults: AlbumResponse[] = [];
  searchingLive = false;
  featuredAlbums: AlbumResponse[] = [];
  loading = true;

  ngOnInit(): void {
    // Busca inicial de clássicos
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

  onSearchInput(): void {
    const q = this.searchQuery.trim();
    if (q.length > 1) {
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
    }
  }

  goToAlbum(externalId: string): void {
    this.liveResults = [];
    this.searchingLive = false;
    this.searchQuery = '';
    this.router.navigate(['/catalog/albums', externalId]);
  }

  search(): void {
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim();
      this.liveResults = [];
      this.searchingLive = false;
      this.router.navigate(['/catalog'], { queryParams: { q } });
    }
  }
}
