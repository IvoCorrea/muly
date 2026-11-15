import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-md bg-[#111b24]/80 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl text-center">
        @if (!errorMessage) {
          <div class="w-12 h-12 rounded-xl bg-muly-green/15 border border-muly-green/30 flex items-center justify-center mx-auto mb-4">
            <span class="w-5 h-5 border-2 border-muly-green/30 border-t-muly-green rounded-full animate-spin"></span>
          </div>
          <h1 class="text-xl font-bold text-white tracking-tight">Conectando sua conta...</h1>
          <p class="text-sm text-muly-muted mt-2">
            Validando sua autorização e preparando sua sessão no Muly.
          </p>
        } @else {
          <div class="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto mb-4">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h1 class="text-xl font-bold text-white tracking-tight">Não foi possível entrar</h1>
          <p class="text-sm text-red-300/90 mt-2 mb-6">{{ errorMessage }}</p>
          <a
            routerLink="/login"
            class="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl bg-muly-green hover:bg-[#19f086] text-[#0b1015] font-semibold text-sm transition-colors"
          >
            Voltar para o login
          </a>
        }
      </div>
    </div>
  `
})
export class OAuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  errorMessage = '';

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const oauthError = params.get('error');
    const code = params.get('code');
    const returnedState = params.get('state') ?? '';
    const pending = this.authService.consumePendingOAuth();

    if (oauthError) {
      this.errorMessage = oauthError === 'access_denied'
        ? 'Autenticação cancelada antes da conclusão.'
        : 'O provedor recusou a solicitação de login.';
      return;
    }

    if (!code || !pending) {
      this.errorMessage = 'Sessão de autenticação expirada ou inválida. Tente entrar novamente.';
      return;
    }

    if (!pending.state || !returnedState || pending.state !== returnedState) {
      this.errorMessage = 'Falha na verificação de segurança (state inválido). Tente novamente.';
      return;
    }

    const redirectUri = `${window.location.origin}/oauth/callback`;

    this.authService.completeOAuth2Login({
      provider: pending.provider,
      code,
      redirectUri
    }).subscribe({
      next: () => {
        this.router.navigateByUrl(pending.returnUrl || '/', { replaceUrl: true });
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Erro ao finalizar o login social. Tente novamente.';
      }
    });
  }
}
