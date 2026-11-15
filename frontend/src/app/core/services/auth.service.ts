import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  OAuth2CallbackRequest,
  OAuth2UrlResponse,
  OAuthProvider,
  RegisterRequest
} from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'muly_token';
  private readonly USER_KEY = 'muly_username';

  private http = inject(HttpClient);
  private router = inject(Router);

  private usernameSignal = signal<string | null>(this.initializeValidSession());
  public currentUser = computed(() => this.usernameSignal());
  public isAuthenticated = computed(() => !!this.usernameSignal() && !!this.getValidToken());

  private initializeValidSession(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token || this.isTokenExpired(token)) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      return null;
    }

    const storedUser = localStorage.getItem(this.USER_KEY);
    if (storedUser && storedUser.trim()) {
      return storedUser.trim();
    }

    const sub = this.extractSubjectFromToken(token);
    if (sub) {
      localStorage.setItem(this.USER_KEY, sub);
      return sub;
    }

    return null;
  }

  private parseJwtPayload(token: string): Record<string, unknown> | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const json = atob(padded);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.parseJwtPayload(token);
    if (!payload) return true;
    const exp = payload['exp'];
    if (typeof exp === 'number') {
      // Margem de 10 segundos
      return exp * 1000 <= Date.now() + 10000;
    }
    return false;
  }

  private extractSubjectFromToken(token: string): string | null {
    const payload = this.parseJwtPayload(token);
    const sub = payload?.['sub'];
    return typeof sub === 'string' && sub.trim() ? sub.trim() : null;
  }

  public getToken(): string | null {
    return this.getValidToken();
  }

  private getValidToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return null;
    if (this.isTokenExpired(token)) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      return null;
    }
    return token;
  }

  public login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, request).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  public register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, request).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  public getOAuth2Url(provider: OAuthProvider, redirectUri: string, state: string): Observable<OAuth2UrlResponse> {
    const params = new HttpParams()
      .set('provider', provider)
      .set('redirectUri', redirectUri)
      .set('state', state);
    return this.http.get<OAuth2UrlResponse>(`${environment.apiUrl}/auth/oauth2/url`, { params });
  }

  public startOAuth2Flow(provider: OAuthProvider, returnUrl = '/'): Observable<OAuth2UrlResponse> {
    const state = this.generateOAuthState();
    const redirectUri = `${window.location.origin}/oauth/callback`;
    sessionStorage.setItem('muly_oauth_pending', JSON.stringify({ provider, state, returnUrl }));

    return this.getOAuth2Url(provider, redirectUri, state).pipe(
      tap(res => {
        window.location.assign(res.url);
      })
    );
  }

  public completeOAuth2Login(request: OAuth2CallbackRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/oauth2/callback`, request).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  public changeUsername(username: string): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${environment.apiUrl}/auth/username`, { username }).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  public consumePendingOAuth(): { provider: OAuthProvider; state: string; returnUrl: string } | null {
    const raw = sessionStorage.getItem('muly_oauth_pending');
    sessionStorage.removeItem('muly_oauth_pending');
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.provider === 'google' || parsed?.provider === 'discord') {
        return {
          provider: parsed.provider,
          state: typeof parsed.state === 'string' ? parsed.state : '',
          returnUrl: typeof parsed.returnUrl === 'string' && parsed.returnUrl.startsWith('/') ? parsed.returnUrl : '/'
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  private generateOAuthState(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  public logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.usernameSignal.set(null);
    this.router.navigate(['/login']);
  }

  public handleSessionExpired(returnUrl?: string): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.usernameSignal.set(null);
    const targetReturn = returnUrl && !returnUrl.startsWith('/login') ? returnUrl : '/profile/me/edit';
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: targetReturn, expired: '1' }
    });
  }

  private handleAuthSuccess(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.USER_KEY, response.username);
    this.usernameSignal.set(response.username);
  }
}
