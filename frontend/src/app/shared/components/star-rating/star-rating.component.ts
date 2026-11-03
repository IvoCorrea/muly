import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-1">
      <div class="flex items-center">
        @for (star of [1, 2, 3, 4, 5]; track star) {
          <button
            type="button"
            [disabled]="readonly"
            (click)="selectRating(star)"
            (mouseenter)="hoverRating = star"
            (mouseleave)="hoverRating = 0"
            class="text-xl transition-transform"
            [ngClass]="{
              'cursor-pointer hover:scale-125': !readonly,
              'cursor-default': readonly,
              'text-emerald-400': (hoverRating || rating) >= star,
              'text-gray-600': (hoverRating || rating) < star
            }"
          >
            ★
          </button>
        }
      </div>
      @if (showValue && rating > 0) {
        <span class="text-sm font-semibold text-emerald-400 ml-1">{{ rating.toFixed(1) }}</span>
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

  selectRating(value: number): void {
    if (!this.readonly) {
      this.rating = value;
      this.ratingChange.emit(value);
    }
  }
}
