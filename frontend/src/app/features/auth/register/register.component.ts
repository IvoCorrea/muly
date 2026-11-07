import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-md mx-auto my-6 sm:my-16 px-4">
      <div class="bg-[#1b2228] border border-[#2a343d] rounded-xl p-6 sm:p-8 shadow-xl">
        <div class="text-center mb-6">
          <h1 class="text-2xl font-black text-white uppercase tracking-wider">Criar Conta</h1>
          <p class="text-xs text-gray-400 mt-1">Junte-se à comunidade para catalogar suas músicas favoritas.</p>
        </div>

        @if (errorMessage) {
          <div class="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg p-3 mb-4">
            {{ errorMessage }}
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="space-y-4" autocomplete="on">
          <div>
            <label for="reg-username" class="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Nome de Usuário
            </label>
            <input
              id="reg-username"
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
              placeholder="letras, numeros, '.' ou '_'"
            />
            @if (fieldErrors['username']) {
              <p class="text-red-400 text-[11px] mt-1">{{ fieldErrors['username'] }}</p>
            }
          </div>

          <div>
            <label for="reg-email" class="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              E-mail
            </label>
            <input
              id="reg-email"
              type="email"
              name="email"
              [(ngModel)]="email"
              required
              inputmode="email"
              autocomplete="email"
              autocapitalize="none"
              autocorrect="off"
              spellcheck="false"
              enterkeyhint="next"
              class="w-full bg-[#12161a] border border-[#2a343d] rounded-lg px-3.5 py-2.5 text-base sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="seu@email.com"
            />
            @if (fieldErrors['email']) {
              <p class="text-red-400 text-[11px] mt-1">{{ fieldErrors['email'] }}</p>
            }
          </div>

          <div>
            <label for="reg-password" class="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Senha (mínimo 6 caracteres)
            </label>
            <div class="relative">
              <input
                id="reg-password"
                [type]="showPassword ? 'text' : 'password'"
                name="password"
                [(ngModel)]="password"
                required
                minlength="6"
                maxlength="64"
                autocomplete="new-password"
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
            @if (fieldErrors['password']) {
              <p class="text-red-400 text-[11px] mt-1">{{ fieldErrors['password'] }}</p>
            }
          </div>

          <button
            type="submit"
            [disabled]="loading || !username || !email || !password"
            class="cursor-pointer disabled:cursor-not-allowed w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold py-3 rounded-lg text-xs uppercase tracking-wider transition-colors mt-2 shadow-md"
          >
            {{ loading ? 'Criando conta...' : 'Cadastrar' }}
          </button>
        </form>

        <p class="text-center text-xs text-gray-400 mt-6">
          Já tem conta?
          <a routerLink="/login" class="text-emerald-400 hover:underline font-semibold ml-1">
            Faça login
          </a>
        </p>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  username = '';
  email = '';
  password = '';
  showPassword = false;
  loading = false;
  errorMessage = '';
  fieldErrors: Record<string, string> = {};

  onSubmit(): void {
    this.errorMessage = '';
    this.fieldErrors = {};
    this.loading = true;

    this.authService.register({
      username: this.username,
      email: this.email,
      password: this.password
    }).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        if (err.error?.fieldErrors) {
          this.fieldErrors = err.error.fieldErrors;
        }
        this.errorMessage = err.error?.message || 'Falha ao cadastrar. Verifique os dados informados.';
      }
    });
  }
}
