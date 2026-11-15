import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-md mx-auto my-6 sm:my-16 px-4">
      <div class="bg-[#1b2228] border border-[#2a343d] rounded-xl p-6 sm:p-8 shadow-xl">
        <div class="text-center mb-6">
          <h1 class="text-2xl font-black text-white uppercase tracking-wider">Entrar no Muly</h1>
          <p class="text-xs text-gray-400 mt-1">Acesse sua conta para avaliar álbuns e montar seu perfil.</p>
        </div>

        @if (sessionExpiredMessage) {
          <div class="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-lg p-3 mb-4">
            {{ sessionExpiredMessage }}
          </div>
        }

        @if (errorMessage) {
          <div class="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg p-3 mb-4">
            {{ errorMessage }}
          </div>
        }

        <div class="space-y-2.5">
          <button
            type="button"
            (click)="loginWithOAuth('google')"
            [disabled]="loading || oauthLoading !== null"
            class="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            @if (oauthLoading === 'google') {
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>Conectando ao Google...</span>
            } @else {
              <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.3 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12s4.3 9.5 9.5 9.5c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-2H12z"/>
                <path fill="#34A853" d="M3.6 7.5l3.2 2.3C7.7 7.7 9.7 6.3 12 6.3c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.5 12 2.5c-3.7 0-6.9 2.1-8.4 5z"/>
                <path fill="#FBBC05" d="M12 21.5c2.6 0 4.8-.9 6.4-2.3l-3-2.5c-.8.6-1.9 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1l-3.2 2.5c1.5 3.2 4.8 5.4 8.8 5.4z"/>
                <path fill="#4285F4" d="M21.1 12.2c0-.6-.1-1.1-.2-2H12v3.9h5.4c-.3 1.4-1.1 2.4-2 3.1l3 2.5c1.8-1.6 2.7-4.1 2.7-7.5z"/>
              </svg>
              <span>Entrar com Google</span>
            }
          </button>

          <button
            type="button"
            (click)="loginWithOAuth('discord')"
            [disabled]="loading || oauthLoading !== null"
            class="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#5865F2]/15 hover:bg-[#5865F2]/25 border border-[#5865F2]/35 hover:border-[#5865F2]/60 text-sm font-medium text-[#dce0ff] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            @if (oauthLoading === 'discord') {
              <span class="w-4 h-4 border-2 border-[#dce0ff]/30 border-t-[#dce0ff] rounded-full animate-spin"></span>
              <span>Conectando ao Discord...</span>
            } @else {
              <svg class="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span>Entrar com Discord</span>
            }
          </button>
        </div>

        <div class="relative my-5">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-white/10"></div>
          </div>
          <div class="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span class="bg-[#111b24] px-3 text-muly-muted">ou entre com seu usuário</span>
          </div>
        </div>

        <form (ngSubmit)="onSubmit()" class="space-y-4" autocomplete="on">
          <div>
            <label for="login-username" class="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Nome de Usuário
            </label>
            <input
              id="login-username"
              type="text"
              name="username"
              [(ngModel)]="username"
              required
              autocomplete="username"
              autocapitalize="none"
              autocorrect="off"
              spellcheck="false"
              enterkeyhint="next"
              class="w-full bg-[#12161a] border border-[#2a343d] rounded-lg px-3.5 py-2.5 text-base sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="ex: johndoe"
            />
          </div>

          <div>
            <label for="login-password" class="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Senha
            </label>
            <div class="relative">
              <input
                id="login-password"
                [type]="showPassword ? 'text' : 'password'"
                name="password"
                [(ngModel)]="password"
                required
                autocomplete="current-password"
                enterkeyhint="done"
                class="w-full bg-[#12161a] border border-[#2a343d] rounded-lg pl-3.5 pr-10 py-2.5 text-base sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                (click)="showPassword = !showPassword"
                class="cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 p-1"
                tabindex="-1"
                [attr.aria-label]="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
              >
                @if (showPassword) {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                } @else {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
              </button>
            </div>
          </div>

          <button
            type="submit"
            [disabled]="loading || !username || !password"
            class="cursor-pointer disabled:cursor-not-allowed w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold py-3 rounded-lg text-xs uppercase tracking-wider transition-colors mt-2 shadow-md"
          >
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>

        <p class="text-center text-xs text-gray-400 mt-6">
          Não tem uma conta?
          <a routerLink="/register" class="text-emerald-400 hover:underline font-semibold ml-1">
            Cadastre-se
          </a>
        </p>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  username = '';
  password = '';
  showPassword = false;
  loading = false;
  oauthLoading: 'google' | 'discord' | null = null;
  errorMessage = '';
  sessionExpiredMessage = '';

  loginWithOAuth(provider: 'google' | 'discord'): void {
    this.errorMessage = '';
    this.oauthLoading = provider;
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';

    this.authService.startOAuth2Flow(provider, returnUrl).subscribe({
      error: (err) => {
        this.oauthLoading = null;
        this.errorMessage = err?.error?.message || 'Não foi possível iniciar o login social.';
      }
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      if (params.get('expired') === '1') {
        this.sessionExpiredMessage = 'Sua sessão expirou por segurança. Faça login novamente para editar seu perfil.';
      }
    });
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.sessionExpiredMessage = '';
    this.loading = true;

    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Falha ao autenticar. Verifique suas credenciais.';
      }
    });
  }
}
