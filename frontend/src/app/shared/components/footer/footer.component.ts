import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="border-t border-[#242c34] bg-[#14181c] py-8 mt-auto text-center text-xs text-gray-500">
      <div class="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <span class="w-4 h-4 rounded-full bg-emerald-500 inline-block"></span>
          <span class="font-bold text-gray-400 uppercase tracking-widest text-xs">Muly</span>
          <span>• O Letterboxd para suas músicas favoritas</span>
        </div>
        <p class="text-[11px] text-gray-600">
          Dados e metadados via Spotify Web API. Multi-user v1.0.
        </p>
      </div>
    </footer>
  `
})
export class FooterComponent {}
