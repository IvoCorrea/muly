import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';

export interface CollageItemData {
  title: string;
  artist: string;
  coverUrl: string | null;
  rating?: number | null;
}

export interface ShareCardData {
  type: 'profile' | 'review' | 'list';
  url: string;
  title: string;
  subtitle?: string;
  username: string;
  rating?: number | null;
  reviewText?: string | null;
  trackBadge?: string | null;
  coverUrl?: string | null;
  gridCovers?: string[];
  statsText?: string;
  collageItems?: CollageItemData[];
  initialFormat?: 'post' | 'stories';
  initialMode?: 'highlights' | 'collage';
}

@Component({
  selector: 'app-share-card-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open && data) {
      <div
        class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        (click)="close()"
      >
        <div
          class="bg-[#1b2228] border border-[#2a343d] rounded-2xl max-w-md w-full p-5 shadow-2xl animate-dropdown my-auto"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div class="flex items-center justify-between pb-3 mb-3 border-b border-[#242c34]">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <h3 class="text-sm font-black uppercase tracking-wider text-white">
                Compartilhar {{ data.type === 'profile' ? 'Perfil' : data.type === 'review' ? 'Review' : 'Lista' }}
              </h3>
            </div>
            <button
              type="button"
              (click)="close()"
              class="cursor-pointer text-gray-400 hover:text-white text-sm px-2 py-0.5 rounded"
            >
              ✕
            </button>
          </div>

          <!-- Link Copiado Banner -->
          <div class="bg-[#12161a] border border-emerald-500/30 rounded-lg p-2.5 mb-3 flex items-center justify-between gap-2">
            <div class="truncate text-xs text-gray-300 font-mono pl-1">
              {{ data.url }}
            </div>
            <button
              type="button"
              (click)="copyLink()"
              class="cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[11px] uppercase tracking-wider px-3 py-1.5 rounded shrink-0 transition-colors"
            >
              {{ linkCopied ? 'Copiado! ✓' : 'Copiar Link' }}
            </button>
          </div>

          <!-- Controles de Formato & Estilo -->
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div class="inline-flex bg-[#12161a] border border-[#242c34] rounded-lg p-0.5">
              <button
                type="button"
                (click)="setFormat('post')"
                class="cursor-pointer px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors"
                [ngClass]="format === 'post' ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:text-white'"
              >
                📐 Feed (4:5)
              </button>
              <button
                type="button"
                (click)="setFormat('stories')"
                class="cursor-pointer px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors"
                [ngClass]="format === 'stories' ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:text-white'"
              >
                📱 Stories (9:16)
              </button>
            </div>

            @if (data.type === 'profile') {
              <div class="inline-flex bg-[#12161a] border border-[#242c34] rounded-lg p-0.5">
                <button
                  type="button"
                  (click)="setMode('highlights')"
                  class="cursor-pointer px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors"
                  [ngClass]="mode === 'highlights' ? 'bg-[#242c34] text-emerald-400' : 'text-gray-400 hover:text-white'"
                >
                  ✨ Destaques
                </button>
                <button
                  type="button"
                  (click)="setMode('collage')"
                  class="cursor-pointer px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors"
                  [ngClass]="mode === 'collage' ? 'bg-[#242c34] text-emerald-400' : 'text-gray-400 hover:text-white'"
                >
                  🔥 Collage 3x3
                </button>
              </div>
            }
          </div>

          <!-- Preview do Card Gerado em Canvas -->
          <div class="bg-[#12161a] border border-[#242c34] rounded-xl p-3 flex flex-col items-center">
            <canvas
              #cardCanvas
              width="720"
              height="900"
              class="w-full rounded-lg shadow-2xl border border-[#2a343d]"
              [ngClass]="format === 'stories' ? 'max-w-[200px]' : 'max-w-[260px]'"
            ></canvas>
          </div>

          <!-- Ações do Card de Imagem -->
          <div class="mt-4 flex items-center gap-2.5">
            <button
              type="button"
              (click)="downloadCard()"
              class="cursor-pointer flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Baixar Card (PNG)</span>
            </button>

            <button
              type="button"
              (click)="shareNative()"
              class="cursor-pointer bg-[#242c34] hover:bg-[#2e3842] text-gray-100 font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-[#323e4a]"
            >
              <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>Enviar</span>
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ShareCardModalComponent implements OnChanges {
  @Input() open = false;
  @Input() data: ShareCardData | null = null;
  @Output() closed = new EventEmitter<void>();

  @ViewChild('cardCanvas') cardCanvas?: ElementRef<HTMLCanvasElement>;

  linkCopied = true;
  format: 'post' | 'stories' = 'post';
  mode: 'highlights' | 'collage' = 'highlights';
  private renderToken = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (this.open && this.data) {
      this.linkCopied = true;
      this.format = this.data.initialFormat || 'post';
      this.mode = this.data.type === 'profile' ? (this.data.initialMode || 'highlights') : 'highlights';
      navigator.clipboard?.writeText(this.data.url);
      setTimeout(() => this.renderCanvas(), 50);
    }
  }

  close(): void {
    this.closed.emit();
  }

  setFormat(fmt: 'post' | 'stories'): void {
    this.format = fmt;
    setTimeout(() => this.renderCanvas(), 20);
  }

  setMode(m: 'highlights' | 'collage'): void {
    this.mode = m;
    setTimeout(() => this.renderCanvas(), 20);
  }

  copyLink(): void {
    if (!this.data) return;
    navigator.clipboard?.writeText(this.data.url);
    this.linkCopied = true;
  }

  async renderCanvas(): Promise<void> {
    const canvas = this.cardCanvas?.nativeElement;
    if (!canvas || !this.data) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentToken = ++this.renderToken;
    const isStories = this.format === 'stories';
    const W = isStories ? 1080 : 720;
    const H = isStories ? 1920 : 900;
    canvas.width = W;
    canvas.height = H;

    // 1. Background Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#1c242c');
    grad.addColorStop(0.5, '#14181c');
    grad.addColorStop(1, '#0b0e11');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Subtle Emerald Top Glow
    const glow = ctx.createRadialGradient(W / 2, isStories ? 240 : 120, 20, W / 2, isStories ? 240 : 120, isStories ? 640 : 380);
    glow.addColorStop(0, 'rgba(16, 185, 129, 0.20)');
    glow.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Border Frame
    const pad = isStories ? 42 : 24;
    ctx.strokeStyle = '#2a343d';
    ctx.lineWidth = isStories ? 4 : 3;
    this.roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, isStories ? 36 : 24);
    ctx.stroke();

    // Top Header: MULY Brand + Type Badge
    const headerX = isStories ? 86 : 56;
    const headerY = isStories ? 124 : 78;
    ctx.fillStyle = '#10b981';
    ctx.font = `900 ${isStories ? 34 : 22}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('MULY', headerX, headerY);

    const badgeText = this.mode === 'collage' && this.data.type === 'profile'
      ? 'RECAP 3X3'
      : this.data.type === 'profile' ? 'PERFIL' : this.data.type === 'review' ? 'REVIEW' : 'LISTA';
    ctx.fillStyle = '#899aa8';
    ctx.font = `700 ${isStories ? 24 : 15}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(badgeText, W - headerX, headerY - 2);

    if (this.mode === 'collage' && this.data.type === 'profile') {
      await this.renderCollageMode(ctx, W, H, isStories, currentToken);
    } else {
      await this.renderHighlightsMode(ctx, W, H, isStories, currentToken);
    }
  }

  private async renderCollageMode(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    isStories: boolean,
    token: number
  ): Promise<void> {
    if (!this.data) return;

    const titleY = isStories ? 210 : 126;
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${isStories ? 44 : 26}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`Meus Discos no Muly`, W / 2, titleY);

    ctx.fillStyle = '#10b981';
    ctx.font = `700 ${isStories ? 26 : 16}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(`@${this.data.username} • Últimas Audições`, W / 2, titleY + (isStories ? 44 : 26));

    // Build up to 9 items from collageItems, falling back to gridCovers or coverUrl
    const items: CollageItemData[] = [...(this.data.collageItems || [])];
    if (items.length === 0 && this.data.gridCovers) {
      this.data.gridCovers.forEach((cover, idx) => {
        items.push({ title: `Top #${idx + 1}`, artist: '', coverUrl: cover, rating: null });
      });
    }
    if (items.length === 0 && this.data.coverUrl) {
      items.push({ title: this.data.title, artist: this.data.subtitle || '', coverUrl: this.data.coverUrl, rating: null });
    }
    const gridItems = items.slice(0, 9);

    const gridSize = isStories ? 860 : 470;
    const gap = isStories ? 18 : 10;
    const cell = (gridSize - gap * 2) / 3;
    const startX = (W - gridSize) / 2;
    const startY = isStories ? 305 : 185;

    for (let i = 0; i < 9; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cx = startX + col * (cell + gap);
      const cy = startY + row * (cell + gap);
      const radius = isStories ? 18 : 10;

      ctx.fillStyle = '#12161a';
      this.roundRect(ctx, cx, cy, cell, cell, radius);
      ctx.fill();

      const item = gridItems[i];
      if (item && item.coverUrl) {
        const img = await this.loadImage(item.coverUrl);
        if (token !== this.renderToken) return;
        if (img) {
          ctx.save();
          this.roundRect(ctx, cx, cy, cell, cell, radius);
          ctx.clip();
          ctx.drawImage(img, cx, cy, cell, cell);
          ctx.restore();
        }
      } else {
        ctx.fillStyle = '#242c34';
        ctx.font = `700 ${isStories ? 42 : 24}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('♪', cx + cell / 2, cy + cell / 2 + (isStories ? 14 : 8));
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = isStories ? 2 : 1.5;
      this.roundRect(ctx, cx, cy, cell, cell, radius);
      ctx.stroke();

      if (item && item.rating && item.rating > 0) {
        const pillW = isStories ? 94 : 56;
        const pillH = isStories ? 38 : 22;
        const px = cx + cell - pillW - (isStories ? 10 : 6);
        const py = cy + cell - pillH - (isStories ? 10 : 6);
        ctx.fillStyle = 'rgba(12, 16, 20, 0.88)';
        this.roundRect(ctx, px, py, pillW, pillH, pillH / 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, px, py, pillW, pillH, pillH / 2);
        ctx.stroke();

        ctx.fillStyle = '#10b981';
        ctx.font = `900 ${isStories ? 20 : 12}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`★ ${item.rating.toFixed(1)}`, px + pillW / 2, py + (isStories ? 26 : 15));
      }
    }

    let cursorY = startY + gridSize + (isStories ? 64 : 42);

    if (isStories && gridItems.length > 0) {
      const listLimit = Math.min(5, gridItems.length);
      for (let i = 0; i < listLimit; i++) {
        const item = gridItems[i];
        const rowText = `${i + 1}. ${item.title}${item.artist ? ' — ' + item.artist : ''}`;
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '700 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'left';
        const truncated = this.truncateText(ctx, rowText, W - 260);
        ctx.fillText(truncated, 96, cursorY);

        if (item.rating && item.rating > 0) {
          ctx.fillStyle = '#10b981';
          ctx.font = '900 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(`★ ${item.rating.toFixed(1)}`, W - 96, cursorY);
        }
        cursorY += 50;
      }
      cursorY += 20;
    }

    if (this.data.statsText) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = `600 ${isStories ? 26 : 17}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(this.data.statsText, W / 2, cursorY + (isStories ? 24 : 16));
    }

    this.drawFooter(ctx, W, H, isStories);
  }

  private async renderHighlightsMode(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    isStories: boolean,
    token: number
  ): Promise<void> {
    if (!this.data) return;

    const covers = this.data.gridCovers && this.data.gridCovers.length > 0
      ? this.data.gridCovers.slice(0, 4)
      : this.data.coverUrl ? [this.data.coverUrl] : [];

    const artTop = isStories ? 230 : 115;

    if (covers.length > 1) {
      const gridSize = isStories ? 640 : 360;
      const gap = isStories ? 22 : 14;
      const startX = (W - gridSize) / 2;
      const cell = (gridSize - gap) / 2;

      for (let i = 0; i < 4; i++) {
        const cx = startX + (i % 2) * (cell + gap);
        const cy = artTop + Math.floor(i / 2) * (cell + gap);
        const radius = isStories ? 20 : 12;
        ctx.fillStyle = '#12161a';
        this.roundRect(ctx, cx, cy, cell, cell, radius);
        ctx.fill();

        if (covers[i]) {
          const img = await this.loadImage(covers[i]);
          if (token !== this.renderToken) return;
          if (img) {
            ctx.save();
            this.roundRect(ctx, cx, cy, cell, cell, radius);
            ctx.clip();
            ctx.drawImage(img, cx, cy, cell, cell);
            ctx.restore();
          }
        }
      }
    } else {
      const coverSize = isStories ? 600 : 340;
      const cx = (W - coverSize) / 2;
      const radius = isStories ? 28 : 18;

      ctx.fillStyle = '#12161a';
      this.roundRect(ctx, cx, artTop, coverSize, coverSize, radius);
      ctx.fill();

      if (covers[0]) {
        const img = await this.loadImage(covers[0]);
        if (token !== this.renderToken) return;
        if (img) {
          ctx.save();
          this.roundRect(ctx, cx, artTop, coverSize, coverSize, radius);
          ctx.clip();
          ctx.drawImage(img, cx, artTop, coverSize, coverSize);
          ctx.restore();
        }
      } else {
        ctx.fillStyle = '#10b981';
        ctx.font = `900 ${isStories ? 180 : 110}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(this.data.username.substring(0, 2).toUpperCase(), W / 2, artTop + (isStories ? 355 : 205));
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = isStories ? 3 : 2;
      this.roundRect(ctx, cx, artTop, coverSize, coverSize, radius);
      ctx.stroke();
    }

    let cursorY = isStories ? 970 : 515;

    if (this.data.trackBadge) {
      ctx.fillStyle = '#10b981';
      ctx.font = `800 ${isStories ? 26 : 16}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(this.data.trackBadge.toUpperCase(), W / 2, cursorY);
      cursorY += isStories ? 56 : 34;
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${isStories ? 52 : 32}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    cursorY = this.drawWrappedText(ctx, this.data.title, W / 2, cursorY, W - (isStories ? 180 : 120), isStories ? 64 : 38, 2);

    if (this.data.subtitle) {
      ctx.fillStyle = '#10b981';
      ctx.font = `700 ${isStories ? 34 : 22}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      cursorY = this.drawWrappedText(ctx, this.data.subtitle, W / 2, cursorY + (isStories ? 14 : 8), W - (isStories ? 180 : 120), isStories ? 44 : 28, 2);
      cursorY += isStories ? 22 : 14;
    }

    if (this.data.rating && this.data.rating > 0) {
      const starsStr = this.formatStars(this.data.rating);
      ctx.fillStyle = '#10b981';
      ctx.font = `900 ${isStories ? 56 : 36}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(`${starsStr}  ${this.data.rating.toFixed(1)}`, W / 2, cursorY + (isStories ? 30 : 14));
      cursorY += isStories ? 92 : 52;
    }

    if (this.data.reviewText) {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = `italic 500 ${isStories ? 32 : 20}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      const quote = `"${this.data.reviewText.trim()}"`;
      cursorY = this.drawWrappedText(ctx, quote, W / 2, cursorY + (isStories ? 24 : 10), W - (isStories ? 190 : 130), isStories ? 46 : 28, isStories ? 6 : 4);
    }

    if (this.data.statsText) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = `600 ${isStories ? 28 : 18}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(this.data.statsText, W / 2, cursorY + (isStories ? 34 : 16));
    }

    this.drawFooter(ctx, W, H, isStories);
  }

  private drawFooter(ctx: CanvasRenderingContext2D, W: number, H: number, isStories: boolean): void {
    if (!this.data) return;
    const xPad = isStories ? 86 : 56;
    const lineY = H - (isStories ? 148 : 92);
    const textY = H - (isStories ? 88 : 54);

    ctx.strokeStyle = '#242c34';
    ctx.lineWidth = isStories ? 2 : 1.5;
    ctx.beginPath();
    ctx.moveTo(xPad, lineY);
    ctx.lineTo(W - xPad, lineY);
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = `700 ${isStories ? 28 : 18}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`@${this.data.username}`, xPad, textY);

    const domainLabel = this.data.type === 'profile'
      ? `muly.xyz/profile/${this.data.username}`
      : 'muly.xyz';
    ctx.fillStyle = '#10b981';
    ctx.font = `700 ${isStories ? 26 : 17}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(domainLabel, W - xPad, textY);
  }

  private truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let t = text;
    while (t.length > 3 && ctx.measureText(t + '...').width > maxWidth) {
      t = t.slice(0, -1);
    }
    return t + '...';
  }

  private formatStars(rating: number): string {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    return '★'.repeat(full) + (half ? '½' : '');
  }

  private loadImage(url: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  private drawWrappedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines: number
  ): number {
    const words = text.split(/\s+/);
    let line = '';
    let linesDrawn = 0;
    let currentY = y;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        linesDrawn++;
        if (linesDrawn >= maxLines) {
          ctx.fillText(line.trim() + '...', x, currentY);
          return currentY + lineHeight;
        }
        ctx.fillText(line.trim(), x, currentY);
        line = words[i] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line.trim()) {
      ctx.fillText(line.trim(), x, currentY);
      currentY += lineHeight;
    }
    return currentY;
  }

  downloadCard(): void {
    const canvas = this.cardCanvas?.nativeElement;
    if (!canvas || !this.data) return;
    const suffix = `${this.mode === 'collage' ? '-collage' : ''}${this.format === 'stories' ? '-stories' : ''}`;
    const link = document.createElement('a');
    link.download = `muly-${this.data.type}${suffix}-${this.data.username}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  async shareNative(): Promise<void> {
    if (!this.data) return;
    const canvas = this.cardCanvas?.nativeElement;
    if (canvas && navigator.share) {
      try {
        const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
        if (blob) {
          const file = new File([blob], `muly-${this.data.type}.png`, { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: this.data.title,
              url: this.data.url,
              files: [file]
            });
            return;
          }
        }
        await navigator.share({
          title: this.data.title,
          url: this.data.url
        });
      } catch {
        this.copyLink();
      }
    } else {
      this.copyLink();
    }
  }
}
