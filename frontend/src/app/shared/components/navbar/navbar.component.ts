import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AlbumResponse } from '../../../core/models/catalog.models';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogService } from '../../../core/services/catalog.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  template: `
    <header #headerContainer class="bg-[#14181c]/95 backdrop-blur-md border-b border-[#242c34] sticky top-0 z-50">
      <div class="max-w-6xl mx-auto px-4 h-15 sm:h-16 flex items-center justify-between gap-3">
        
        <!-- Logo e Links Desktop -->
        <div class="flex items-center gap-8">
          <a routerLink="/" class="flex items-center gap-2.5 group shrink-0">
            <img
              src="/logo-circle.png"
              alt="Muly Logo"
              class="w-8 h-8 rounded-full object-contain group-hover:scale-105 transition-transform"
            />
            <span class="text-xl font-black text-gray-100 tracking-wider group-hover:text-emerald-400 transition-colors uppercase">
              Muly
            </span>
          </a>

          <nav class="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-400">
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

        <!-- Barra de busca rápida & Auth controls (Desktop) -->
        <div class="hidden md:flex items-center gap-4">
          <div #searchContainer class="relative">
            <form (ngSubmit)="searchFast()">
              <input
                type="text"
                name="searchQuery"
                [(ngModel)]="searchQuery"
                (focus)="onSearchFocus()"
                (input)="onSearchInput()"
                autocomplete="off"
                placeholder="Buscar álbum ou artista..."
                class="w-56 lg:w-64 bg-[#202830] text-gray-200 placeholder-gray-500 text-xs rounded-full pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 border border-transparent transition-all"
              />
              <svg class="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </form>

            @if (showDropdown && (searchingLive || liveResults.length > 0)) {
              <div class="animate-dropdown absolute right-0 w-80 z-50 bg-[#12161a] border border-[#2a343d] rounded-lg mt-2 max-h-64 overflow-y-auto divide-y divide-[#242c34] shadow-2xl">
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
                type="button"
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

        <!-- Botões Mobile: Busca Rápida + Hamburger Menu -->
        <div class="flex md:hidden items-center gap-2">
          <button
            type="button"
            (click)="toggleMobileSearch()"
            class="cursor-pointer w-10 h-10 rounded-lg bg-[#1b2228] border border-[#2a343d] flex items-center justify-center text-gray-300 hover:text-emerald-400 transition-colors"
            [ngClass]="{ 'border-emerald-500/60 text-emerald-400': mobileSearchOpen }"
            aria-label="Buscar álbuns"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <button
            type="button"
            (click)="toggleMobileMenu()"
            class="cursor-pointer w-10 h-10 rounded-lg bg-[#1b2228] border border-[#2a343d] flex items-center justify-center text-gray-200 hover:text-emerald-400 transition-colors"
            [ngClass]="{ 'border-emerald-500/60 text-emerald-400': mobileMenuOpen }"
            aria-label="Abrir menu"
          >
            @if (mobileMenuOpen) {
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            } @else {
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            }
          </button>
        </div>
      </div>

      <!-- Gaveta de Busca Mobile -->
      @if (mobileSearchOpen) {
        <div class="md:hidden border-t border-[#242c34] bg-[#12161a] px-4 py-3 animate-dropdown">
          <form (ngSubmit)="searchFast()" class="flex gap-2">
            <input
              type="search"
              name="mobileSearchQuery"
              [(ngModel)]="searchQuery"
              (input)="onSearchInput()"
              autocomplete="off"
              enterkeyhint="search"
              placeholder="Buscar álbum ou artista..."
              class="flex-1 bg-[#1b2228] border border-[#2a343d] rounded-lg px-3.5 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              class="cursor-pointer bg-emerald-500 text-black font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg shrink-0"
            >
              Ir
            </button>
          </form>

          @if (searchingLive || liveResults.length > 0) {
            <div class="mt-2 max-h-60 overflow-y-auto divide-y divide-[#242c34] rounded-lg border border-[#2a343d] bg-[#161b20]">
              @if (searchingLive && liveResults.length === 0) {
                @for (s of [1, 2, 3]; track s) {
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
                    class="p-2.5 flex items-center gap-3 cursor-pointer active:bg-[#242c34]"
                  >
                    @if (res.coverUrl) {
                      <img [src]="res.coverUrl" [alt]="res.title" class="w-9 h-9 rounded object-cover shrink-0" />
                    }
                    <div class="truncate text-xs">
                      <p class="font-semibold text-gray-100 truncate">{{ res.title }}</p>
                      <p class="text-gray-400 truncate">{{ res.artist }}</p>
                    </div>
                  </div>
                }
              }
            </div>
          }
        </div>
      }

      <!-- Gaveta do Hamburger Menu Mobile -->
      @if (mobileMenuOpen) {
        <div class="md:hidden border-t border-[#242c34] bg-[#12161a] px-4 py-4 space-y-3 animate-dropdown shadow-2xl">
          @if (authService.isAuthenticated()) {
            <div class="flex items-center justify-between pb-3 border-b border-[#242c34]">
              <a
                [routerLink]="['/profile', authService.currentUser()]"
                (click)="closeMobilePanels()"
                class="flex items-center gap-3"
              >
                <div class="w-9 h-9 rounded-full bg-[#1b2228] border border-emerald-500 flex items-center justify-center text-white font-black text-xs uppercase">
                  {{ authService.currentUser()?.substring(0, 2) }}
                </div>
                <div>
                  <p class="text-sm font-bold text-white">{{ authService.currentUser() }}</p>
                  <p class="text-[11px] text-emerald-400 font-semibold">Ver meu perfil →</p>
                </div>
              </a>
              <button
                type="button"
                (click)="logout()"
                class="cursor-pointer text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30"
              >
                Sair
              </button>
            </div>
          }

          <nav class="grid grid-cols-1 gap-1.5">
            <a
              routerLink="/"
              (click)="closeMobilePanels()"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-gray-200 hover:bg-[#1b2228] active:bg-[#242c34]"
            >
              <span>🏠</span>
              <span>Início</span>
            </a>
            <a
              routerLink="/catalog"
              (click)="closeMobilePanels()"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-gray-200 hover:bg-[#1b2228] active:bg-[#242c34]"
            >
              <span>💿</span>
              <span>Catálogo de Álbuns</span>
            </a>
            <a
              routerLink="/lists"
              (click)="closeMobilePanels()"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-gray-200 hover:bg-[#1b2228] active:bg-[#242c34]"
            >
              <span>📋</span>
              <span>Listas da Comunidade</span>
            </a>
            @if (authService.isAuthenticated()) {
              <a
                routerLink="/lists/new"
                (click)="closeMobilePanels()"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-emerald-400 hover:bg-[#1b2228] active:bg-[#242c34]"
              >
                <span>➕</span>
                <span>Criar Nova Lista</span>
              </a>
              <a
                routerLink="/profile/me/edit"
                (click)="closeMobilePanels()"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-gray-200 hover:bg-[#1b2228] active:bg-[#242c34]"
              >
                <span>⚙️</span>
                <span>Customizar Perfil</span>
              </a>
            }
          </nav>

          @if (!authService.isAuthenticated()) {
            <div class="pt-3 border-t border-[#242c34] grid grid-cols-2 gap-2.5">
              <a
                routerLink="/login"
                (click)="closeMobilePanels()"
                class="text-center py-2.5 rounded-lg bg-[#1b2228] border border-[#2a343d] text-gray-100 font-bold text-xs uppercase tracking-wider"
              >
                Entrar
              </a>
              <a
                routerLink="/register"
                (click)="closeMobilePanels()"
                class="text-center py-2.5 rounded-lg bg-emerald-500 text-black font-black text-xs uppercase tracking-wider"
              >
                Cadastrar
              </a>
            </div>
          }
        </div>
      }
    </header>

    <!-- Barra de Navegação Inferior Mobile (Estilo App) -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#12161a]/95 backdrop-blur-md border-t border-[#242c34] grid grid-cols-4 h-14">
      <a
        routerLink="/"
        routerLinkActive="text-emerald-400"
        [routerLinkActiveOptions]="{ exact: true }"
        (click)="closeMobilePanels()"
        class="flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:text-gray-200 text-[10px] font-bold"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span>Início</span>
      </a>

      <a
        routerLink="/catalog"
        routerLinkActive="text-emerald-400"
        (click)="closeMobilePanels()"
        class="flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:text-gray-200 text-[10px] font-bold"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>Catálogo</span>
      </a>

      <a
        routerLink="/lists"
        routerLinkActive="text-emerald-400"
        (click)="closeMobilePanels()"
        class="flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:text-gray-200 text-[10px] font-bold"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        <span>Listas</span>
      </a>

      @if (authService.isAuthenticated()) {
        <a
          [routerLink]="['/profile', authService.currentUser()]"
          routerLinkActive="text-emerald-400"
          (click)="closeMobilePanels()"
          class="flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:text-gray-200 text-[10px] font-bold"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Perfil</span>
        </a>
      } @else {
        <a
          routerLink="/login"
          routerLinkActive="text-emerald-400"
          (click)="closeMobilePanels()"
          class="flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:text-gray-200 text-[10px] font-bold"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          <span>Entrar</span>
        </a>
      }
    </nav>
  `
})
export class NavbarComponent implements OnInit {
  authService = inject(AuthService);
  private catalogService = inject(CatalogService);
  private router = inject(Router);

  @ViewChild('searchContainer') searchContainer?: ElementRef<HTMLElement>;
  @ViewChild('headerContainer') headerContainer?: ElementRef<HTMLElement>;

  searchQuery = '';
  liveResults: AlbumResponse[] = [];
  searchingLive = false;
  showDropdown = false;

  mobileMenuOpen = false;
  mobileSearchOpen = false;

  ngOnInit(): void {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.closeMobilePanels();
    });
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showDropdown && !this.searchingLive && !this.mobileMenuOpen && !this.mobileSearchOpen) {
      return;
    }
    const target = event.target as Node;
    if (this.searchContainer && !this.searchContainer.nativeElement.contains(target)) {
      this.showDropdown = false;
      this.searchingLive = false;
    }
    if (this.headerContainer && !this.headerContainer.nativeElement.contains(target)) {
      this.mobileMenuOpen = false;
      this.mobileSearchOpen = false;
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    if (this.mobileMenuOpen) {
      this.mobileSearchOpen = false;
    }
  }

  toggleMobileSearch(): void {
    this.mobileSearchOpen = !this.mobileSearchOpen;
    if (this.mobileSearchOpen) {
      this.mobileMenuOpen = false;
    }
  }

  closeMobilePanels(): void {
    this.mobileMenuOpen = false;
    this.mobileSearchOpen = false;
    this.showDropdown = false;
    this.searchingLive = false;
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
    this.closeMobilePanels();
    this.liveResults = [];
    this.searchQuery = '';
    this.router.navigate(['/catalog/albums', externalId]);
  }

  searchFast(): void {
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim();
      this.closeMobilePanels();
      this.liveResults = [];
      this.searchQuery = '';
      this.router.navigate(['/catalog'], { queryParams: { q } });
    }
  }

  logout(): void {
    this.closeMobilePanels();
    this.authService.logout();
  }
}
