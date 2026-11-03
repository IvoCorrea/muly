import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlbumResponse } from '../../../core/models/catalog.models';
import { CatalogService } from '../../../core/services/catalog.service';
import { AlbumCardComponent } from '../../../shared/components/album-card/album-card.component';

@Component({
  selector: 'app-catalog-search',
  standalone: true,
  imports: [CommonModule, FormsModule, AlbumCardComponent],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8">
      
      <!-- Cabeçalho de Busca -->
      <div class="mb-8">
        <h1 class="text-3xl font-black text-white tracking-wide uppercase">Catálogo de Álbuns</h1>
        <p class="text-sm text-gray-400 mt-1">Busque milhões de discos no Spotify e adicione à sua coleção.</p>

        <form (ngSubmit)="onSearch()" class="mt-6 flex gap-3 max-w-xl">
          <input
            type="text"
            name="query"
            [(ngModel)]="query"
            placeholder="Digite o nome do álbum ou artista..."
            class="flex-1 bg-[#1b2228] border border-[#2a343d] rounded-lg px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
          />
          <button
            type="submit"
            [disabled]="loading || !query.trim()"
            class="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold px-6 py-3 rounded-lg text-xs uppercase tracking-wider transition-colors"
          >
            {{ loading ? 'Buscando...' : 'Buscar' }}
          </button>
        </form>
      </div>

      <!-- Resultados -->
      @if (loading) {
        <div class="flex items-center justify-center py-20 text-emerald-400">
          <svg class="animate-spin h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
        </div>
      } @else if (albums.length > 0) {
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          @for (album of albums; track album.externalId) {
            <app-album-card [album]="album" />
          }
        </div>
      } @else if (searched) {
        <div class="text-center py-16 bg-[#1b2228] border border-[#2a343d] rounded-lg">
          <p class="text-gray-300 font-semibold">Nenhum álbum encontrado para "{{ query }}"</p>
          <p class="text-xs text-gray-500 mt-1">Tente buscar por termos mais genéricos ou pelo nome exato do artista.</p>
        </div>
      } @else {
        <!-- Estado inicial / sugestões -->
        <div class="text-center py-16 border border-dashed border-[#2a343d] rounded-lg text-gray-500">
          <p class="text-sm">Use o campo de busca acima para encontrar seus álbuns favoritos.</p>
          <div class="flex flex-wrap justify-center gap-2 mt-4">
            @for (suggestion of ['Abbey Road', 'OK Computer', 'Random Access Memories', 'The Dark Side of the Moon']; track suggestion) {
              <button
                type="button"
                (click)="searchSuggestion(suggestion)"
                class="text-xs bg-[#1b2228] hover:bg-[#252f38] text-gray-300 border border-[#2a343d] px-3 py-1.5 rounded-full transition-colors"
              >
                {{ suggestion }}
              </button>
            }
          </div>
        </div>
      }

    </div>
  `
})
export class CatalogSearchComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  query = '';
  albums: AlbumResponse[] = [];
  loading = false;
  searched = false;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const q = params['q'];
      if (q) {
        this.query = q;
        this.fetchAlbums(q);
      }
    });
  }

  onSearch(): void {
    if (this.query.trim()) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { q: this.query.trim() },
        queryParamsHandling: 'merge'
      });
    }
  }

  searchSuggestion(suggestion: string): void {
    this.query = suggestion;
    this.onSearch();
  }

  private fetchAlbums(q: string): void {
    this.loading = true;
    this.searched = true;
    this.catalogService.search(q).subscribe({
      next: (results) => {
        this.albums = results;
        this.loading = false;
      },
      error: () => {
        this.albums = [];
        this.loading = false;
      }
    });
  }
}
