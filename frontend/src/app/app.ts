import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ServerStatusService } from './core/services/server-status.service';
import { FooterComponent } from './shared/components/footer/footer.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <div class="min-h-screen flex flex-col bg-[#14181c] text-[#9ab] selection:bg-emerald-500 selection:text-black pb-16 md:pb-0">
      <app-navbar />

      @if (serverStatus.isWakingUp()) {
        <div class="bg-emerald-950/80 border-b border-emerald-500/30 backdrop-blur-md px-4 py-2.5 text-xs text-emerald-100 shadow-lg">
          <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div class="flex items-center gap-2.5">
              <span class="relative flex h-2.5 w-2.5 shrink-0">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <p class="leading-snug">
                <strong class="font-bold text-emerald-300">Conectando ao servidor...</strong>
                <span class="text-emerald-200/90 ml-1">
                  Estamos estabelecendo a conexão. Os dados serão carregados automaticamente em instantes.
                </span>
              </p>
            </div>
            <span class="text-[11px] font-mono font-bold text-emerald-300 bg-emerald-900/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full shrink-0">
              Conectando • {{ serverStatus.elapsedSeconds() }}s
            </span>
          </div>
        </div>
      }

      <main class="flex-1">
        <router-outlet />
      </main>
      <app-footer />
    </div>
  `,
  styleUrl: './app.css'
})
export class App {
  title = 'Muly';
  serverStatus = inject(ServerStatusService);
}
