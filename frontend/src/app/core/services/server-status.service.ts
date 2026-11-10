import { Injectable, signal } from '@angular/core';

const CACHE_PREFIX = 'muly_cache_v1_';

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class ServerStatusService {
  readonly isWakingUp = signal(false);
  readonly elapsedSeconds = signal(0);

  private slowRequestCount = 0;
  private tickerId: ReturnType<typeof setInterval> | null = null;
  private wakeupStartTime: number | null = null;

  startTrackingRequest(): () => void {
    let markedSlow = false;
    let finished = false;

    const timerId = setTimeout(() => {
      if (finished) return;
      markedSlow = true;
      this.incrementSlowCount();
    }, 3000);

    return () => {
      if (finished) return;
      finished = true;
      clearTimeout(timerId);
      if (markedSlow) {
        this.decrementSlowCount();
      }
    };
  }

  notifyRetry(): void {
    if (!this.isWakingUp()) {
      this.isWakingUp.set(true);
      this.startTicker();
    }
  }

  private incrementSlowCount(): void {
    this.slowRequestCount++;
    if (this.slowRequestCount > 0 && !this.isWakingUp()) {
      this.isWakingUp.set(true);
      this.startTicker();
    }
  }

  private decrementSlowCount(): void {
    this.slowRequestCount = Math.max(0, this.slowRequestCount - 1);
    if (this.slowRequestCount === 0) {
      this.isWakingUp.set(false);
      this.stopTicker();
    }
  }

  private startTicker(): void {
    if (this.tickerId) return;
    this.wakeupStartTime = Date.now() - 3000;
    this.elapsedSeconds.set(3);
    this.tickerId = setInterval(() => {
      if (this.wakeupStartTime) {
        this.elapsedSeconds.set(Math.max(3, Math.floor((Date.now() - this.wakeupStartTime) / 1000)));
      }
    }, 1000);
  }

  private stopTicker(): void {
    if (this.tickerId) {
      clearInterval(this.tickerId);
      this.tickerId = null;
    }
    this.wakeupStartTime = null;
    this.elapsedSeconds.set(0);
  }

  getCached<T>(key: string, maxAgeMs = 1000 * 60 * 60 * 24): T | null {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const entry = JSON.parse(raw) as CacheEntry<T>;
      if (!entry || typeof entry.timestamp !== 'number') return null;
      if (Date.now() - entry.timestamp > maxAgeMs) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  }

  setCached<T>(key: string, data: T): void {
    try {
      const entry: CacheEntry<T> = {
        timestamp: Date.now(),
        data
      };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch {
      // Ignore quota errors in private browsing or full storage
    }
  }
}
