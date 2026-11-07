import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="inline-flex items-center gap-1.5 select-none" (mouseleave)="hoverRating = 0">
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

            <!-- Estrela preenchida (100% ou 50% para meia estrela) -->
            @if (activeValue >= star) {
              <span class="absolute inset-0 text-emerald-400 pointer-events-none overflow-hidden">★</span>
            } @else if (activeValue >= star - 0.5) {
              <span class="absolute left-0 top-0 bottom-0 w-1/2 text-emerald-400 pointer-events-none overflow-hidden">★</span>
            }

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
      @if (showValue && activeValue > 0) {
        <span class="text-sm font-semibold text-emerald-400 ml-1 tabular-nums">
          {{ activeValue.toFixed(1) }}
        </span>
      }
    </div>
  `
})
export class StarRatingComponent {
  @Input() rating: number = 0;
  @Input() readonly: boolean = false;
  @Input() showValue: boolean = true;
  @Output() ratingChange = new EventEmitter<number>();

  hoverRating: number = 0;

  get activeValue(): number {
    return this.hoverRating > 0 ? this.hoverRating : this.rating;
  }

  selectHalf(star: number): void {
    if (this.readonly) return;
    const val = star - 0.5;
    this.rating = val;
    this.ratingChange.emit(val);
  }

  selectFull(star: number): void {
    if (this.readonly) return;
    // Se já estiver com a nota cheia nesta estrela e clicar de novo, alterna para meia estrela (ótimo para mobile)
    const val = this.rating === star ? star - 0.5 : star;
    this.rating = val;
    this.ratingChange.emit(val);
  }
}
