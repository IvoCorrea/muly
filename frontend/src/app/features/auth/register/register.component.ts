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
    <div class="max-w-md mx-auto my-16 px-4">
      <div class="bg-[#1b2228] border border-[#2a343d] rounded-lg p-8 shadow-xl">
        <div class="text-center mb-6">
          <h1 class="text-2xl font-black text-white uppercase tracking-wider">Criar Conta</h1>
          <p class="text-xs text-gray-400 mt-1">Junte-se à comunidade para catalogar suas músicas favoritas.</p>
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
              placeholder="letras, numeros, '.' ou '_'"
            />
            @if (fieldErrors['username']) {
              <p class="text-red-400 text-[11px] mt-1">{{ fieldErrors['username'] }}</p>
            }
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
              E-mail
            </label>
            <input
              type="email"
              name="email"
              [(ngModel)]="email"
              required
              class="w-full bg-[#12161a] border border-[#2a343d] rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="seu@email.com"
            />
            @if (fieldErrors['email']) {
              <p class="text-red-400 text-[11px] mt-1">{{ fieldErrors['email'] }}</p>
            }
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Senha (mínimo 6 caracteres)
            </label>
            <input
              type="password"
              name="password"
              [(ngModel)]="password"
              required
              minlength="6"
              maxlength="64"
              class="w-full bg-[#12161a] border border-[#2a343d] rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="••••••••"
            />
            @if (fieldErrors['password']) {
              <p class="text-red-400 text-[11px] mt-1">{{ fieldErrors['password'] }}</p>
            }
          </div>

          <button
            type="submit"
            [disabled]="loading || !username || !email || !password"
            class="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold py-2.5 rounded text-xs uppercase tracking-wider transition-colors mt-2"
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
