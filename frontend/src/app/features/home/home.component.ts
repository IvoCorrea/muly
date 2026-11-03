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
            O Letterboxd de Música
          </span>
          <h1 class="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Descubra, avalie e compartilhe seus álbuns.
          </h1>
          <p class="text-sm sm:text-base text-gray-400 mt-4 leading-relaxed max-w-xl mx-auto">
            Catalogue o que você ouve, dê notas de 1 a 5 estrelas, escreva resenhas e personalize seu perfil público com seus álbuns favoritos.
          </p>

          <!-- Input de Busca Rápida -->
          <form (ngSubmit)="search()" class="mt-8 flex gap-2 max-w-md mx-auto">
            <input
              type="text"
              name="searchQuery"
              [(ngModel)]="searchQuery"
              placeholder="Buscar artista, banda ou álbum..."
              class="flex-1 bg-[#101417] border border-[#2a343d] rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500 shadow-inner"
            />
            <button
              type="submit"
              class="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-3 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-md"
            >
              Buscar
            </button>
          </form>

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
          <div class="flex justify-center py-12 text-emerald-400">
            <svg class="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
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

  search(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/catalog'], { queryParams: { q: this.searchQuery.trim() } });
    }
  }
}
