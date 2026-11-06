import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AlbumResponse } from '../../../core/models/catalog.models';
import { CatalogService } from '../../../core/services/catalog.service';
import { ListsService } from '../../../core/services/lists.service';

@Component({
  selector: 'app-list-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-8 pb-4 border-b border-[#242c34]">
        <div>
          <h1 class="text-2xl font-black text-white uppercase tracking-wider">
            {{ isEdit ? 'Editar Lista de Álbuns' : 'Nova Lista de Álbuns' }}
          </h1>
          <p class="text-xs text-gray-400 mt-1">
            Monte uma coleção temática de álbuns estilo Letterboxd para compartilhar no seu perfil.
          </p>
        </div>
        <a
          [routerLink]="isEdit && listId ? ['/lists', listId] : ['/lists']"
          class="text-xs font-semibold text-gray-400 hover:text-white uppercase tracking-wider"
        >
          ← Cancelar
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
        <!-- Dados da Lista -->
        <div class="bg-[#1b2228] border border-[#2a343d] rounded-xl p-6 mb-6 space-y-4">
          <div>
            <label class="block text-xs font-black uppercase tracking-widest text-emerald-400 mb-1.5">
              Título da Lista *
            </label>
            <input
              type="text"
              [(ngModel)]="title"
              maxlength="150"
              placeholder="Ex: Álbuns com Capa Rosa, Clássicos do Rock Francês, Meus 10/10..."
              class="w-full bg-[#12161a] border border-[#242c34] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label class="block text-xs font-black uppercase tracking-widest text-gray-300 mb-1.5">
              Descrição (Opcional)
            </label>
            <textarea
              [(ngModel)]="description"
              rows="3"
              maxlength="2000"
              placeholder="Conte sobre o tema ou critério desta lista..."
              class="w-full bg-[#12161a] border border-[#242c34] rounded-lg px-4 py-2.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            ></textarea>
          </div>
        </div>

        <!-- Adicionar Álbuns -->
        <div class="bg-[#1b2228] border border-[#2a343d] rounded-xl p-6 mb-8">
          <h2 class="text-xs font-black uppercase tracking-widest text-emerald-400 mb-1">
            Álbuns da Lista ({{ selectedAlbums.length }})
          </h2>
          <p class="text-xs text-gray-400 mb-4">
            Busque álbuns no Spotify para adicionar à grade da sua lista.
          </p>

          <div #albumSearchContainer class="relative mb-6">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (focus)="onSearchFocus()"
              (input)="onSearchInput()"
              placeholder="Buscar álbum ou artista para adicionar à lista..."
              class="w-full bg-[#12161a] border border-[#242c34] rounded-lg px-4 py-2.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />

            @if (showDropdown && (searching || searchResults.length > 0)) {
              <div class="animate-dropdown absolute left-0 right-0 z-30 bg-[#12161a] border border-[#2a343d] rounded-lg mt-1 max-h-60 overflow-y-auto divide-y divide-[#242c34] shadow-2xl">
                @if (searching && searchResults.length === 0) {
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
                  @for (res of searchResults; track res.externalId) {
                    <div
                      (click)="addAlbum(res)"
                      class="animate-search-item p-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#202830] transition-colors"
                    >
                      <div class="flex items-center gap-3 truncate">
                        @if (res.coverUrl) {
                          <img [src]="res.coverUrl" class="w-9 h-9 rounded object-cover shrink-0" />
                        }
                        <div class="truncate text-xs">
                          <p class="font-semibold text-gray-200 truncate">{{ res.title }}</p>
                          <p class="text-[11px] text-gray-400 truncate">
                            {{ res.artist }}
                            @if (res.releaseYear) {
                              <span>({{ res.releaseYear }})</span>
                            }
                          </p>
                        </div>
                      </div>
                      <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded shrink-0">
                        {{ isAlreadyAdded(res.externalId) ? 'Adicionado ✓' : '+ Adicionar' }}
                      </span>
                    </div>
                  }
                }
              </div>
            }
          </div>

          <!-- Grade de Álbuns Selecionados -->
          @if (selectedAlbums.length > 0) {
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              @for (album of selectedAlbums; track album.externalId; let idx = $index) {
                <div class="bg-[#12161a] border border-[#242c34] rounded-lg p-2.5 relative group">
                  <span class="absolute top-1.5 left-1.5 w-5 h-5 rounded bg-black/80 text-emerald-400 font-black text-[10px] flex items-center justify-center z-10">
                    {{ idx + 1 }}
                  </span>

                  <button
                    type="button"
                    (click)="removeAlbum(idx)"
                    class="cursor-pointer absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/80 hover:bg-red-500 text-white text-[10px] flex items-center justify-center z-10 transition-colors"
                    title="Remover da lista"
                  >
                    ✕
                  </button>

                  <div class="aspect-square w-full rounded overflow-hidden bg-[#181e24] mb-2">
                    @if (album.coverUrl) {
                      <img [src]="album.coverUrl" [alt]="album.title" class="w-full h-full object-cover" />
                    }
                  </div>

                  <p class="text-xs font-bold text-gray-200 truncate">{{ album.title }}</p>
                  <p class="text-[10px] text-gray-400 truncate">{{ album.artist }}</p>

                  <div class="flex items-center justify-between mt-2 pt-1.5 border-t border-[#1e262d]">
                    <button
                      type="button"
                      (click)="moveAlbum(idx, -1)"
                      [disabled]="idx === 0"
                      class="cursor-pointer disabled:opacity-30 text-[10px] text-gray-400 hover:text-white px-1.5 py-0.5 rounded bg-[#1b2228]"
                      title="Mover para trás"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      (click)="moveAlbum(idx, 1)"
                      [disabled]="idx === selectedAlbums.length - 1"
                      class="cursor-pointer disabled:opacity-30 text-[10px] text-gray-400 hover:text-white px-1.5 py-0.5 rounded bg-[#1b2228]"
                      title="Mover para frente"
                    >
                      →
                    </button>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="p-10 border border-dashed border-[#2a343d] rounded-lg text-center text-xs text-gray-500">
              Use a busca acima para adicionar álbuns à sua lista.
            </div>
          }
        </div>

        @if (errorMessage) {
          <div class="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg p-3 mb-6">
            {{ errorMessage }}
          </div>
        }

        <div class="flex justify-end gap-3">
          <button
            type="button"
            (click)="saveList()"
            [disabled]="saving || !title.trim()"
            class="cursor-pointer disabled:opacity-50 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider text-xs px-6 py-3 rounded-lg transition-colors shadow-lg"
          >
            {{ saving ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Publicar Lista') }}
          </button>
        </div>
      }
    </div>
  `
})
export class ListFormComponent implements OnInit {
  private listsService = inject(ListsService);
  private catalogService = inject(CatalogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChild('albumSearchContainer') albumSearchContainer?: ElementRef<HTMLElement>;

  isEdit = false;
  listId: string | null = null;
  loading = false;
  saving = false;
  errorMessage = '';

  title = '';
  description = '';
  selectedAlbums: AlbumResponse[] = [];

  searchQuery = '';
  searchResults: AlbumResponse[] = [];
  searching = false;
  showDropdown = false;

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.albumSearchContainer && !this.albumSearchContainer.nativeElement.contains(event.target as Node)) {
      this.showDropdown = false;
      this.searching = false;
    }
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.listId = id;
      this.loading = true;
      this.listsService.getListDetail(id).subscribe({
        next: (detail) => {
          this.title = detail.title;
          this.description = detail.description || '';
          this.selectedAlbums = detail.items.map(i => i.album);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.router.navigate(['/lists']);
        }
      });
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
      this.searching = true;
      this.catalogService.search(q).subscribe({
        next: (res) => {
          if (this.searchQuery.trim() === q) {
            this.searchResults = res;
            this.searching = false;
          }
        },
        error: () => {
          this.searchResults = [];
          this.searching = false;
        }
      });
    } else {
      this.searchResults = [];
      this.searching = false;
      this.showDropdown = false;
    }
  }

  isAlreadyAdded(externalId: string): boolean {
    return this.selectedAlbums.some(a => a.externalId === externalId);
  }

  addAlbum(album: AlbumResponse): void {
    if (!this.isAlreadyAdded(album.externalId)) {
      this.selectedAlbums = [...this.selectedAlbums, album];
    }
    this.searchQuery = '';
    this.searchResults = [];
    this.showDropdown = false;
  }

  removeAlbum(index: number): void {
    this.selectedAlbums = this.selectedAlbums.filter((_, i) => i !== index);
  }

  moveAlbum(index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (target < 0 || target >= this.selectedAlbums.length) return;
    const copy = [...this.selectedAlbums];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    this.selectedAlbums = copy;
  }

  saveList(): void {
    if (!this.title.trim()) return;
    this.saving = true;
    this.errorMessage = '';

    const payload = {
      title: this.title.trim(),
      description: this.description.trim() || null,
      spotifyIds: this.selectedAlbums.map(a => a.externalId)
    };

    const req$ = this.isEdit && this.listId
      ? this.listsService.updateList(this.listId, payload)
      : this.listsService.createList(payload);

    req$.subscribe({
      next: (saved) => {
        this.saving = false;
        this.router.navigate(['/lists', saved.id]);
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err.error?.message || 'Não foi possível salvar a lista.';
      }
    });
  }
}
