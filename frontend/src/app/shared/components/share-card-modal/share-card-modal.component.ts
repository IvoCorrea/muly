import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';

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
}

@Component({
  selector: 'app-share-card-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open && data) {
      <div
        class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        (click)="close()"
      >
        <div
          class="bg-[#1b2228] border border-[#2a343d] rounded-2xl max-w-md w-full p-5 shadow-2xl animate-dropdown"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div class="flex items-center justify-between pb-3 mb-4 border-b border-[#242c34]">
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
          <div class="bg-[#12161a] border border-emerald-500/30 rounded-lg p-2.5 mb-4 flex items-center justify-between gap-2">
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

          <!-- Preview do Card Gerado em Canvas -->
          <div class="bg-[#12161a] border border-[#242c34] rounded-xl p-3 flex flex-col items-center">
            <canvas
              #cardCanvas
              width="720"
              height="900"
              class="w-full max-w-[270px] rounded-lg shadow-2xl border border-[#2a343d]"
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

  ngOnChanges(changes: SimpleChanges): void {
    if (this.open && this.data) {
      this.linkCopied = true;
      navigator.clipboard?.writeText(this.data.url);
      setTimeout(() => this.renderCanvas(), 50);
    }
  }

  close(): void {
    this.closed.emit();
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

    const W = canvas.width;
    const H = canvas.height;

    // 1. Background Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#1c242c');
    grad.addColorStop(0.5, '#14181c');
    grad.addColorStop(1, '#0e1114');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Subtle Emerald Top Glow
    const glow = ctx.createRadialGradient(W / 2, 120, 20, W / 2, 120, 380);
    glow.addColorStop(0, 'rgba(16, 185, 129, 0.18)');
    glow.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Border Frame
    ctx.strokeStyle = '#2a343d';
    ctx.lineWidth = 3;
    this.roundRect(ctx, 24, 24, W - 48, H - 48, 24);
    ctx.stroke();

    // Top Header: MULY Brand + Type Badge
    ctx.fillStyle = '#10b981';
    ctx.font = '900 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('MULY', 56, 78);

    const badgeText = this.data.type === 'profile' ? 'PERFIL' : this.data.type === 'review' ? 'REVIEW' : 'LISTA';
    ctx.fillStyle = '#899aa8';
    ctx.font = '700 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(badgeText, W - 56, 76);

    // Load Cover(s)
    const covers = this.data.gridCovers && this.data.gridCovers.length > 0
      ? this.data.gridCovers.slice(0, 4)
      : this.data.coverUrl ? [this.data.coverUrl] : [];

    if (covers.length > 1) {
      // 2x2 Grid of Covers (for Lists or Top 4)
      const gridSize = 360;
      const startX = (W - gridSize) / 2;
      const startY = 115;
      const cell = (gridSize - 14) / 2;

      for (let i = 0; i < 4; i++) {
        const cx = startX + (i % 2) * (cell + 14);
        const cy = startY + Math.floor(i / 2) * (cell + 14);
        ctx.fillStyle = '#12161a';
        this.roundRect(ctx, cx, cy, cell, cell, 12);
        ctx.fill();

        if (covers[i]) {
          const img = await this.loadImage(covers[i]);
          if (img) {
            ctx.save();
            this.roundRect(ctx, cx, cy, cell, cell, 12);
            ctx.clip();
            ctx.drawImage(img, cx, cy, cell, cell);
            ctx.restore();
          }
        }
      }
    } else {
      // Single Main Cover Art
      const coverSize = 340;
      const cx = (W - coverSize) / 2;
      const cy = 115;

      ctx.fillStyle = '#12161a';
      this.roundRect(ctx, cx, cy, coverSize, coverSize, 18);
      ctx.fill();

      if (covers[0]) {
        const img = await this.loadImage(covers[0]);
        if (img) {
          ctx.save();
          this.roundRect(ctx, cx, cy, coverSize, coverSize, 18);
          ctx.clip();
          ctx.drawImage(img, cx, cy, coverSize, coverSize);
          ctx.restore();
        }
      } else {
        // Avatar Initials for Profile without cover
        ctx.fillStyle = '#10b981';
        ctx.font = '900 110px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.data.username.substring(0, 2).toUpperCase(), W / 2, cy + 205);
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 2;
      this.roundRect(ctx, cx, cy, coverSize, coverSize, 18);
      ctx.stroke();
    }

    let cursorY = 515;

    // Optional Track Badge
    if (this.data.trackBadge) {
      ctx.fillStyle = '#10b981';
      ctx.font = '800 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.data.trackBadge.toUpperCase(), W / 2, cursorY);
      cursorY += 34;
    }

    // Main Title (Album / List / Username)
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    cursorY = this.drawWrappedText(ctx, this.data.title, W / 2, cursorY, W - 120, 38, 2);

    // Subtitle (Artist / Info)
    if (this.data.subtitle) {
      ctx.fillStyle = '#10b981';
      ctx.font = '700 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(this.data.subtitle, W / 2, cursorY + 8);
      cursorY += 42;
    }

    // Star Rating (for Reviews)
    if (this.data.rating && this.data.rating > 0) {
      const starsStr = this.formatStars(this.data.rating);
      ctx.fillStyle = '#10b981';
      ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`${starsStr}  ${this.data.rating.toFixed(1)}`, W / 2, cursorY + 14);
      cursorY += 52;
    }

    // Review Text or Description Quote
    if (this.data.reviewText) {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'italic 500 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const quote = `"${this.data.reviewText.trim()}"`;
      cursorY = this.drawWrappedText(ctx, quote, W / 2, cursorY + 10, W - 130, 28, 4);
    }

    // Stats Text
    if (this.data.statsText) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(this.data.statsText, W / 2, cursorY + 16);
    }

    // Footer Bar: User & muly.xyz
    ctx.strokeStyle = '#242c34';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(56, H - 92);
    ctx.lineTo(W - 56, H - 92);
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`@${this.data.username}`, 56, H - 54);

    ctx.fillStyle = '#10b981';
    ctx.font = '700 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('muly.xyz', W - 56, H - 54);
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
    const link = document.createElement('a');
    link.download = `muly-${this.data.type}-${this.data.username}.png`;
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
