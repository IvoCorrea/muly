import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AlbumResponse } from '../../../core/models/catalog.models';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogService } from '../../../core/services/catalog.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  template: `
    <header class="bg-[#14181c] border-b border-[#242c34] sticky top-0 z-50">
      <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        <!-- Logo e Links -->
        <div class="flex items-center gap-8">
          <a routerLink="/" class="flex items-center gap-2.5 group">
            <img
              src="/logo-circle.png"
              alt="Muly Logo"
              class="w-8 h-8 rounded-full object-contain group-hover:scale-105 transition-transform"
            />
            <span class="text-xl font-black text-gray-100 tracking-wider group-hover:text-emerald-400 transition-colors uppercase">
              Muly
            </span>
          </a>

          <nav class="flex items-center gap-4 md:gap-6 text-sm font-semibold text-gray-400">
            <a
              routerLink="/catalog"
              routerLinkActive="text-emerald-400"
              class="hover:text-gray-100 transition-colors uppercase tracking-wider text-xs"
            >
              Catálogo
            </a>
            <a
              routerLink="/lists"
              routerLinkActive="text-emerald-400"
              class="hover:text-gray-100 transition-colors uppercase tracking-wider text-xs"
            >
              Listas
            </a>
            @if (authService.isAuthenticated()) {
              <a
                [routerLink]="['/profile', authService.currentUser()]"
                routerLinkActive="text-emerald-400"
                class="hover:text-gray-100 transition-colors uppercase tracking-wider text-xs"
              >
                Meu Perfil
              </a>
            }
          </nav>
        </div>

        <!-- Barra de busca rápida & Auth controls -->
        <div class="flex items-center gap-4">
          <div #searchContainer class="relative hidden sm:block">
            <form (ngSubmit)="searchFast()">
              <input
                type="text"
                name="searchQuery"
                [(ngModel)]="searchQuery"
                (focus)="onSearchFocus()"
                (input)="onSearchInput()"
                autocomplete="off"
                placeholder="Buscar álbum ou artista..."
                class="w-48 md:w-64 bg-[#202830] text-gray-200 placeholder-gray-500 text-xs rounded-full pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 border border-transparent transition-all"
              />
              <svg class="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </form>

            @if (showDropdown && (searchingLive || liveResults.length > 0)) {
              <div class="animate-dropdown absolute right-0 w-72 md:w-80 z-50 bg-[#12161a] border border-[#2a343d] rounded-lg mt-2 max-h-64 overflow-y-auto divide-y divide-[#242c34] shadow-2xl">
                @if (searchingLive && liveResults.length === 0) {
                  @for (s of [1, 2, 3, 4]; track s) {
                    <div class="p-2 flex items-center gap-3">
                      <div class="w-8 h-8 rounded skeleton-shimmer shrink-0"></div>
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
                      class="animate-search-item p-2 flex items-center gap-3 cursor-pointer hover:bg-[#202830] transition-colors"
                    >
                      @if (res.coverUrl) {
                        <img [src]="res.coverUrl" [alt]="res.title" class="w-8 h-8 rounded object-cover shrink-0" />
                      } @else {
                        <div class="w-8 h-8 rounded bg-[#202830] shrink-0"></div>
                      }
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

          @if (authService.isAuthenticated()) {
            <div class="flex items-center gap-3">
              <span class="text-xs font-medium text-gray-400 hidden lg:inline">
                Olá, <strong class="text-emerald-400 font-semibold">{{ authService.currentUser() }}</strong>
              </span>
              <button
                (click)="logout()"
                class="cursor-pointer text-xs font-semibold px-3 py-1.5 rounded bg-[#242c34] text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-colors uppercase tracking-wider"
              >
                Sair
              </button>
            </div>
          } @else {
            <div class="flex items-center gap-2">
              <a
                routerLink="/login"
                class="text-xs font-semibold px-3 py-1.5 rounded text-gray-300 hover:text-white transition-colors uppercase tracking-wider"
              >
                Entrar
              </a>
              <a
                routerLink="/register"
                class="text-xs font-semibold px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-colors uppercase tracking-wider"
              >
                Cadastrar
              </a>
            </div>
          }
        </div>
      </div>
    </header>
  `
})
export class NavbarComponent {
  authService = inject(AuthService);
  private catalogService = inject(CatalogService);
  private router = inject(Router);

  @ViewChild('searchContainer') searchContainer?: ElementRef<HTMLElement>;

  searchQuery = '';
  liveResults: AlbumResponse[] = [];
  searchingLive = false;
  showDropdown = false;

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.searchContainer && !this.searchContainer.nativeElement.contains(event.target as Node)) {
      this.showDropdown = false;
      this.searchingLive = false;
    }
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

  searchFast(): void {
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim();
      this.showDropdown = false;
      this.liveResults = [];
      this.searchingLive = false;
      this.searchQuery = '';
      this.router.navigate(['/catalog'], { queryParams: { q } });
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
