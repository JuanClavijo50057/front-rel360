import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  mode = signal<'login' | 'register'>('login');

  email = '';
  password = '';
  fullName = '';

  isLoading = signal(false);
  errorMsg = signal<string | null>(null);

  constructor(private auth: AuthService, private router: Router) {}

  toggleMode(): void {
    this.mode.set(this.mode() === 'login' ? 'register' : 'login');
    this.errorMsg.set(null);
  }

  submit(): void {
    this.errorMsg.set(null);
    this.isLoading.set(true);

    const obs =
      this.mode() === 'login'
        ? this.auth.login(this.email, this.password)
        : this.auth.register(this.email, this.password, this.fullName || undefined);

    obs.subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const detail = err?.error?.detail;
        this.errorMsg.set(detail ?? 'Ocurrió un error, intenta de nuevo');
      },
    });
  }
}