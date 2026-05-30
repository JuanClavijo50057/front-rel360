import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './auth/login/login.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    component: HomeComponent,         // ← antes era PdfUploadComponent
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];