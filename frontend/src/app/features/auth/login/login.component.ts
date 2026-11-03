import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-md mx-auto my-16 px-4">
      <div class="bg-[#1b2228] border border-[#2a343d] rounded-lg p-8 shadow-xl">
        <div class="text-center mb-6">
          <h1 class="text-2xl font-black text-white uppercase tracking-wider">Entrar no Muly</h1>
          <p class="text-xs text-gray-400 mt-1">Acesse sua conta para avaliar álbuns e montar seu perfil.</p>
        </div>

        @if (errorMessage) {
          <div class="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded p-3 mb-4">
            {{ errorMessage }}
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Nome de Usuário
            </label>
            <input
              type="text"
              name="username"
              [(ngModel)]="username"
              required
              class="w-full bg-[#12161a] border border-[#2a343d] rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="ex: johndoe"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Senha
            </label>
            <input
              type="password"
              name="password"
              [(ngModel)]="password"
              required
              class="w-full bg-[#12161a] border border-[#2a343d] rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            [disabled]="loading || !username || !password"
            class="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold py-2.5 rounded text-xs uppercase tracking-wider transition-colors mt-2"
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
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  username = '';
  password = '';
  loading = false;
  errorMessage = '';

  onSubmit(): void {
    this.errorMessage = '';
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
