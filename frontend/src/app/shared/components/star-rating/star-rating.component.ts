import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { formatRating } from '../../../core/utils/rating.utils';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="inline-flex items-center gap-2 select-none" (mouseleave)="hoverRating = 0">
      <div class="flex items-center gap-0.5">
        @for (star of [1, 2, 3, 4, 5]; track star) {
          <div
            class="relative inline-flex items-center justify-center text-xl leading-none transition-transform"
            [ngClass]="{
              'cursor-pointer hover:scale-125': !readonly,
              'cursor-default': readonly
            }"
          >
            <!-- Estrela base (vazia/cinza) -->
            <span class="text-gray-600 pointer-events-none">★</span>

            <!-- Estrela preenchida (proporcional de 0% a 100%, suportando notas exatas como 4.89) -->
            <span
              class="absolute left-0 top-0 bottom-0 text-emerald-400 pointer-events-none overflow-hidden whitespace-nowrap"
              [style.width.%]="getStarFillPercent(star)"
            >★</span>

            <!-- Áreas de clique/hover para meia estrela (esquerda = X.5) e estrela inteira (direita = X.0) -->
            @if (!readonly) {
              <button
                type="button"
                class="cursor-pointer absolute left-0 top-0 bottom-0 w-1/2 h-full z-10 focus:outline-none"
                [attr.aria-label]="(star - 0.5) + ' estrelas'"
                [title]="(star - 0.5).toFixed(1) + ' ★'"
                (mouseenter)="hoverRating = star - 0.5"
                (click)="selectHalf(star)"
              ></button>
              <button
                type="button"
                class="cursor-pointer absolute right-0 top-0 bottom-0 w-1/2 h-full z-10 focus:outline-none"
                [attr.aria-label]="star + ' estrelas'"
                [title]="star.toFixed(1) + ' ★'"
                (mouseenter)="hoverRating = star"
                (click)="selectFull(star)"
              ></button>
            }
          </div>
        }
      </div>

      @if (!readonly) {
        <div class="inline-flex items-center gap-1 ml-1">
          <input
            type="text"
            inputmode="decimal"
            [ngModel]="inputValue"
            (ngModelChange)="onManualInputChange($event)"
            (blur)="onManualInputBlur()"
            placeholder="0,00"
            maxlength="4"
            aria-label="Nota exata de 0,01 a 5,00"
            title="Digite uma nota exata (ex: 4,89)"
            class="w-14 bg-[#101417] border border-[#2a343d] focus:border-emerald-500 rounded px-1.5 py-0.5 text-xs font-bold text-emerald-400 text-center tabular-nums focus:outline-none transition-colors"
          />
          <span class="text-[11px] text-gray-500 font-semibold">/ 5</span>
        </div>
      } @else if (showValue && activeValue > 0) {
        <span class="text-sm font-semibold text-emerald-400 ml-0.5 tabular-nums">
          {{ formatRating(activeValue) }}
        </span>
      }
    </div>
  `
})
export class StarRatingComponent implements OnChanges {
  @Input() rating: number = 0;
  @Input() readonly: boolean = false;
  @Input() showValue: boolean = true;
  @Output() ratingChange = new EventEmitter<number>();

  hoverRating: number = 0;
  inputValue: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rating']) {
      this.syncInputFromRating();
    }
  }

  get activeValue(): number {
    return this.hoverRating > 0 ? this.hoverRating : this.rating;
  }

  formatRating(value: number): string {
    return formatRating(value);
  }

  getStarFillPercent(star: number): number {
    const diff = this.activeValue - (star - 1);
    if (diff <= 0) return 0;
    if (diff >= 1) return 100;
    return Math.round(diff * 100);
  }

  selectHalf(star: number): void {
    if (this.readonly) return;
    const val = star - 0.5;
    this.applyRating(val);
  }

  selectFull(star: number): void {
    if (this.readonly) return;
    const val = this.rating === star ? star - 0.5 : star;
    this.applyRating(val);
  }

  onManualInputChange(raw: string): void {
    this.inputValue = raw;
    const cleaned = raw.trim().replace(',', '.');
    if (!cleaned) {
      this.rating = 0;
      this.ratingChange.emit(0);
      return;
    }

    const parsed = Number(cleaned);
    if (isNaN(parsed)) {
      return;
    }

    const clamped = Math.max(0.01, Math.min(5.0, Math.round(parsed * 100) / 100));
    this.rating = clamped;
    this.ratingChange.emit(clamped);
  }

  onManualInputBlur(): void {
    this.syncInputFromRating();
  }

  private applyRating(val: number): void {
    this.rating = val;
    this.syncInputFromRating();
    this.ratingChange.emit(val);
  }

  private syncInputFromRating(): void {
    this.inputValue = this.rating > 0 ? formatRating(this.rating) : '';
  }
}
