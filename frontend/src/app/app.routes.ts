import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { AlbumDetailComponent } from './features/catalog/album-detail/album-detail.component';
import { CatalogSearchComponent } from './features/catalog/catalog-search/catalog-search.component';
import { HomeComponent } from './features/home/home.component';
import { ProfileEditComponent } from './features/profile/profile-edit/profile-edit.component';
import { ProfileViewComponent } from './features/profile/profile-view/profile-view.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Muly | A rede social para quem ama música' },
  { path: 'login', component: LoginComponent, title: 'Entrar | Muly' },
  { path: 'register', component: RegisterComponent, title: 'Cadastrar | Muly' },
  { path: 'catalog', component: CatalogSearchComponent, title: 'Catálogo | Muly' },
  { path: 'catalog/albums/:spotifyId', component: AlbumDetailComponent, title: 'Álbum | Muly' },
  {
    path: 'profile/me/edit',
    component: ProfileEditComponent,
    canActivate: [authGuard],
    title: 'Customizar Perfil | Muly'
  },
  { path: 'profile/:username', component: ProfileViewComponent, title: 'Perfil | Muly' },
  { path: '**', redirectTo: '' }
];
