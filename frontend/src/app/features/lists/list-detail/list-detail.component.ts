import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AlbumListDetailResponse } from '../../../core/models/lists.models';
import { AuthService } from '../../../core/services/auth.service';
import { ListsService } from '../../../core/services/lists.service';
import { ShareCardData, ShareCardModalComponent } from '../../../shared/components/share-card-modal/share-card-modal.component';

@Component({
  selector: 'app-list-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ShareCardModalComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-6 pb-24">
      @if (loading) {
        <div class="flex items-center justify-center py-24 text-emerald-400">
          <svg class="animate-spin h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
        </div>
      } @else if (list) {

        <!-- Top Navigation Bar estilo Letterboxd (Imagem de Referência) -->
        <div class="flex items-center justify-between pb-4 mb-5 border-b border-[#242c34]">
          <a
            routerLink="/lists"
            class="flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Listas</span>
          </a>

          <span class="text-base font-bold text-white tracking-wide">List</span>

          <div class="flex items-center gap-3">
            <!-- Share button -->
            <button
              type="button"
              (click)="shareList()"
              class="cursor-pointer text-gray-300 hover:text-emerald-400 transition-colors p-1.5 rounded-lg hover:bg-[#1b2228] flex items-center gap-1 text-xs"
              title="Compartilhar lista"
            >
              @if (copiedShare) {
                <span class="text-emerald-400 font-bold text-[11px]">Copiado! ✓</span>
              } @else {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              }
            </button>

            <!-- Toggle Numerado / Limpo -->
            <button
              type="button"
              (click)="showNumbers = !showNumbers"
              class="cursor-pointer text-gray-300 hover:text-emerald-400 transition-colors p-1.5 rounded-lg hover:bg-[#1b2228]"
              [title]="showNumbers ? 'Ocultar posições' : 'Mostrar posições'"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Cabeçalho do Autor + Toggle de Visualização -->
        <div class="flex items-center justify-between mb-3">
          <a
            [routerLink]="['/profile', list.username]"
            class="inline-flex items-center gap-2.5 group"
          >
            <div class="w-8 h-8 rounded-full bg-[#12161a] border border-emerald-500 flex items-center justify-center text-white font-black text-xs uppercase shadow">
              {{ list.username.substring(0, 2) }}
            </div>
            <span class="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
              {{ list.username }}
            </span>
            <span class="text-[9px] font-black uppercase tracking-wider bg-amber-500 text-black px-1.5 py-0.5 rounded">
              PRO
            </span>
          </a>

          <div class="flex items-center gap-2">
            @if (isOwner) {
              <a
                [routerLink]="['/lists', list.id, 'edit']"
                class="text-xs font-bold text-emerald-400 hover:underline px-2 py-1"
              >
                Editar
              </a>
              <button
                type="button"
                (click)="deleteList()"
                class="cursor-pointer text-xs font-bold text-red-400 hover:underline px-2 py-1"
              >
                Excluir
              </button>
            }
            <button
              type="button"
              (click)="compactMode = !compactMode"
              class="cursor-pointer text-gray-400 hover:text-white p-1 rounded transition-colors"
              [title]="compactMode ? 'Ver detalhes abaixo da capa' : 'Modo grade compacta (pôsteres)'"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 6h4v4H4V6zm6 0h10v4H10V6zM4 14h4v4H4v-4zm6 0h10v4H10v-4z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Título e Descrição da Lista -->
        <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
          {{ list.title }}
        </h1>

        @if (list.description) {
          <p class="text-sm text-[#899aa8] leading-relaxed whitespace-pre-wrap mb-5">
            {{ list.description }}
          </p>
        }

        <!-- Barra de Like, Compartilhamento e Porcentagem Avaliada (igual à imagem) -->
        <div class="flex items-center justify-between py-3 mb-5 border-y border-[#1e262d]">
          <div class="flex items-center gap-4">
            <button
              type="button"
              (click)="toggleLike()"
              [disabled]="liking"
              class="cursor-pointer inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors"
              [ngClass]="list.likedByMe ? 'text-rose-400' : 'text-[#7c8c9a] hover:text-white'"
            >
              <svg
                class="w-5 h-5 transition-transform active:scale-125"
                [attr.fill]="list.likedByMe ? 'currentColor' : 'none'"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{{ list.likedByMe ? 'LIKED' : 'LIKE?' }}</span>
            </button>

            <span class="text-xs text-[#677785] font-medium">
              {{ list.likesCount }} {{ list.likesCount === 1 ? 'like' : 'likes' }}
            </span>

            <button
              type="button"
              (click)="shareList()"
              class="cursor-pointer inline-flex items-center gap-1 text-xs text-[#7c8c9a] hover:text-emerald-400 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>{{ copiedShare ? 'Link copiado!' : 'Compartilhar' }}</span>
            </button>
          </div>

          <!-- Olho Azul com % de Álbuns Avaliados pelo Usuário (idêntico à referência) -->
          <div
            class="inline-flex items-center gap-1.5 text-xs font-bold text-[#40bcf4]"
            title="Porcentagem de álbuns desta lista que você já avaliou"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
            <span>{{ list.reviewedPercentage }}%</span>
          </div>
        </div>

        <!-- Grade de 4 Colunas de Capas de Álbuns (estilo Letterboxd) -->
        @if (list.items.length > 0) {
          <div class="grid grid-cols-4 gap-2 sm:gap-2.5">
            @for (item of list.items; track item.position) {
              <div class="group relative">
                <a
                  [routerLink]="['/catalog/albums', item.album.externalId]"
                  class="block aspect-square w-full rounded-md overflow-hidden bg-[#12161a] border border-[#2a343d] group-hover:border-emerald-400 transition-all shadow-md relative"
                >
                  @if (item.album.coverUrl) {
                    <img
                      [src]="item.album.coverUrl"
                      [alt]="item.album.title"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  } @else {
                    <div class="w-full h-full flex items-center justify-center text-gray-600 text-xs text-center p-2">
                      {{ item.album.title }}
                    </div>
                  }

                  <!-- Overlay no Hover com Nome do Álbum e Artista -->
                  <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                    <p class="text-[11px] font-bold text-white leading-tight line-clamp-2">
                      {{ item.album.title }}
                    </p>
                    <p class="text-[10px] text-emerald-400 truncate">
                      {{ item.album.artist }}
                    </p>
                  </div>

                  <!-- Número da Posição -->
                  @if (showNumbers) {
                    <span class="absolute top-1.5 left-1.5 min-w-5 h-5 px-1 rounded bg-black/80 border border-white/15 text-white font-black text-[10px] flex items-center justify-center shadow">
                      {{ item.position }}
                    </span>
                  }

                  <!-- Badge de Álbum já avaliado -->
                  @if (item.reviewedByMe) {
                    <span
                      class="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full bg-[#40bcf4] text-black flex items-center justify-center text-[9px] font-black shadow"
                      title="Você já avaliou este álbum"
                    >
                      ✓
                    </span>
                  }
                </a>

                <!-- Link rápido para o Spotify no canto superior direito no hover -->
                <a
                  [href]="'https://open.spotify.com/album/' + item.album.externalId"
                  target="_blank"
                  rel="noopener noreferrer"
                  (click)="$event.stopPropagation()"
                  class="opacity-0 group-hover:opacity-100 transition-opacity absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black flex items-center justify-center shadow-lg z-10"
                  title="Ouvir álbum no Spotify"
                >
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </a>

                @if (!compactMode) {
                  <div class="mt-1.5 px-0.5">
                    <p class="text-[11px] font-semibold text-gray-200 truncate">{{ item.album.title }}</p>
                    <p class="text-[10px] text-gray-500 truncate">{{ item.album.artist }}</p>
                  </div>
                }
              </div>
            }
          </div>
        } @else {
          <div class="p-12 border border-dashed border-[#2a343d] rounded-xl text-center text-xs text-gray-500">
            Esta lista ainda não possui álbuns.
          </div>
        }

        <!-- Pílula Flutuante de Comentários (idêntica às imagens "1 comment" / "29 comments") -->
        <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button
            type="button"
            (click)="scrollToComments()"
            class="cursor-pointer bg-[#445566]/95 hover:bg-[#556677] backdrop-blur-md text-white font-bold text-xs px-5 py-2 rounded-full shadow-2xl border border-white/15 transition-transform hover:scale-105"
          >
            {{ list.comments.length }} {{ list.comments.length === 1 ? 'comment' : 'comments' }}
          </button>
        </div>

        <!-- Seção de Comentários -->
        <div id="list-comments-section" class="mt-14 pt-8 border-t border-[#242c34]">
          <h2 class="text-xs font-black uppercase tracking-widest text-gray-300 mb-4">
            Comentários ({{ list.comments.length }})
          </h2>

          @if (authService.isAuthenticated()) {
            <form (ngSubmit)="submitComment()" class="mb-6 flex gap-2">
              <input
                type="text"
                name="newComment"
                [(ngModel)]="newComment"
                placeholder="Adicione um comentário sobre esta lista..."
                class="flex-1 bg-[#1b2228] border border-[#2a343d] rounded-lg px-4 py-2.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                [disabled]="postingComment || !newComment.trim()"
                class="cursor-pointer disabled:opacity-50 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors"
              >
                Comentar
              </button>
            </form>
          }

          @if (list.comments.length > 0) {
            <div class="space-y-3">
              @for (c of list.comments; track c.id) {
                <div class="bg-[#1b2228] border border-[#2a343d] rounded-lg p-3.5 flex items-start justify-between gap-3">
                  <div>
                    <div class="flex items-center gap-2">
                      <a
                        [routerLink]="['/profile', c.username]"
                        class="text-xs font-bold text-emerald-400 hover:underline"
                      >
                        {{ c.username }}
                      </a>
                      <span class="text-[10px] text-gray-500">{{ formatDate(c.createdAt) }}</span>
                    </div>
                    <p class="text-xs text-gray-200 mt-1 leading-relaxed">{{ c.content }}</p>
                  </div>

                  @if (canDeleteComment(c.username)) {
                    <button
                      type="button"
                      (click)="deleteComment(c.id)"
                      class="cursor-pointer text-[11px] text-gray-500 hover:text-red-400"
                      title="Excluir comentário"
                    >
                      ✕
                    </button>
                  }
                </div>
              }
            </div>
          } @else {
            <p class="text-xs text-gray-500">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
          }
        </div>

      } @else {
        <div class="text-center py-20 text-gray-400">
          <p>Lista não encontrada.</p>
          <a routerLink="/lists" class="text-emerald-400 text-xs font-semibold hover:underline mt-2 inline-block">
            Voltar para as listas
          </a>
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
export class ListDetailComponent implements OnInit {
  authService = inject(AuthService);
  private listsService = inject(ListsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private titleService = inject(Title);
  private metaService = inject(Meta);

  list: AlbumListDetailResponse | null = null;
  loading = true;
  liking = false;
  postingComment = false;
  newComment = '';

  compactMode = true;
  showNumbers = false;
  copiedShare = false;
  shareModalOpen = false;
  shareCardData: ShareCardData | null = null;

  get isOwner(): boolean {
    return !!this.list && this.authService.currentUser()?.toLowerCase() === this.list.username.toLowerCase();
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadList(id);
      }
    });
  }

  loadList(id: string): void {
    this.loading = true;
    this.listsService.getListDetail(id).subscribe({
      next: (data) => {
        this.list = data;
        this.loading = false;
        const title = `${data.title} — Lista por @${data.username} | Muly`;
        this.titleService.setTitle(title);
        this.metaService.updateTag({ property: 'og:title', content: title });
        if (data.description) {
          this.metaService.updateTag({ property: 'og:description', content: data.description });
        }
        if (data.items[0]?.album?.coverUrl) {
          this.metaService.updateTag({ property: 'og:image', content: data.items[0].album.coverUrl });
        }
      },
      error: () => {
        this.list = null;
        this.loading = false;
      }
    });
  }

  toggleLike(): void {
    if (!this.list) return;
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.liking = true;
    this.listsService.toggleLike(this.list.id).subscribe({
      next: (updated) => {
        this.list = updated;
        this.liking = false;
      },
      error: () => {
        this.liking = false;
      }
    });
  }

  submitComment(): void {
    if (!this.list || !this.newComment.trim()) return;
    this.postingComment = true;
    this.listsService.addComment(this.list.id, { content: this.newComment.trim() }).subscribe({
      next: (comment) => {
        if (this.list) {
          this.list.comments = [...this.list.comments, comment];
        }
        this.newComment = '';
        this.postingComment = false;
      },
      error: () => {
        this.postingComment = false;
      }
    });
  }

  canDeleteComment(commentUsername: string): boolean {
    const current = this.authService.currentUser()?.toLowerCase();
    if (!current) return false;
    return current === commentUsername.toLowerCase() || this.isOwner;
  }

  deleteComment(commentId: string): void {
    if (!this.list) return;
    this.listsService.deleteComment(this.list.id, commentId).subscribe({
      next: () => {
        if (this.list) {
          this.list.comments = this.list.comments.filter(c => c.id !== commentId);
        }
      }
    });
  }

  deleteList(): void {
    if (!this.list || !confirm('Tem certeza que deseja excluir esta lista?')) return;
    this.listsService.deleteList(this.list.id).subscribe({
      next: () => {
        this.router.navigate(['/lists']);
      }
    });
  }

  shareList(): void {
    if (!this.list) return;
    const url = `${window.location.origin}/lists/${this.list.id}`;
    navigator.clipboard?.writeText(url);
    this.copiedShare = true;

    const covers = this.list.items
      .map(i => i.album.coverUrl)
      .filter((c): c is string => !!c);

    this.shareCardData = {
      type: 'list',
      url,
      title: this.list.title,
      subtitle: `${this.list.items.length} ${this.list.items.length === 1 ? 'álbum' : 'álbuns'} • ♥ ${this.list.likesCount}`,
      username: this.list.username,
      reviewText: this.list.description,
      coverUrl: covers[0] || null,
      gridCovers: covers.length >= 2 ? covers : undefined
    };
    this.shareModalOpen = true;

    setTimeout(() => {
      this.copiedShare = false;
    }, 2500);
  }

  scrollToComments(): void {
    const el = document.getElementById('list-comments-section');
    el?.scrollIntoView({ behavior: 'smooth' });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
