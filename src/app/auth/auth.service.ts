import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AuthResponse {
  access_token: string;
  token_type: string;
  email: string;
  full_name: string | null;
}

export interface CurrentUser {
  email: string;
  full_name: string | null;
}

const TOKEN_KEY = 'rel360_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private API = environment.apiUrl;

  private _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private _user = signal<CurrentUser | null>(this._loadUserFromToken());

  readonly isLoggedIn = computed(() => !!this._token());
  readonly currentUser = this._user.asReadonly();
  readonly token = this._token.asReadonly();

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.http
      .post<AuthResponse>(`${this.API}/auth/login`, { email, password })
      .pipe(tap((res) => this._saveSession(res)));
  }

  register(email: string, password: string, full_name?: string) {
    return this.http
      .post<AuthResponse>(`${this.API}/auth/register`, { email, password, full_name })
      .pipe(tap((res) => this._saveSession(res)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this._token();
  }

  private _saveSession(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.access_token);
    this._token.set(res.access_token);
    this._user.set({ email: res.email, full_name: res.full_name });
  }

  private _loadUserFromToken(): CurrentUser | null {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }
      return { email: payload.email, full_name: null };
    } catch {
      return null;
    }
  }
}