import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="border-t border-[#242c34] bg-[#14181c] py-8 mt-auto text-xs text-gray-500">
      <div class="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <img src="/logo-circle.png" alt="Muly Logo" class="w-5 h-5 rounded-full object-contain inline-block" />
          <span class="font-bold text-gray-400 uppercase tracking-widest text-xs">Muly</span>
          <span>• A rede social para suas músicas favoritas</span>
        </div>
        <div class="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-[11px] text-gray-500">
          <span>
            Developed by
            <a
              href="https://github.com/IvoCorrea"
              target="_blank"
              rel="noopener noreferrer"
              class="text-emerald-400 hover:underline font-semibold transition-colors"
            >
              Ivo Albuquerque
            </a>
          </span>
          <span class="hidden sm:inline text-gray-600">•</span>
          <p class="text-[11px] text-gray-600">
            Dados e metadados via Spotify Web API. Multi-user v1.6.0.
          </p>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {}
