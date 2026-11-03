import { Injectable, signal, computed } from '@angular/core';

export interface AdminUser {
  id: string;
  username: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly _isAuthenticated = signal<boolean>(false);
  private readonly _currentUser = signal<AdminUser | null>(null);
  private readonly _token = signal<string | null>(null);

  public readonly isAuthenticated = this._isAuthenticated.asReadonly();
  public readonly currentUser = this._currentUser.asReadonly();
  public readonly username = computed(() => this._currentUser()?.username ?? '');

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    if (typeof window === 'undefined') return;

    try {
      const savedToken = localStorage.getItem('precocerto_admin_token');
      const savedUserJson = localStorage.getItem('precocerto_admin_user');

      if (savedToken && savedUserJson) {
        const user = JSON.parse(savedUserJson) as AdminUser;
        this._token.set(savedToken);
        this._currentUser.set(user);
        this._isAuthenticated.set(true);
      }
    } catch {
      this.logout();
    }
  }

  public async login(username: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.sucesso) {
        this._token.set(data.token);
        this._currentUser.set(data.usuario);
        this._isAuthenticated.set(true);

        if (typeof window !== 'undefined') {
          localStorage.setItem('precocerto_admin_token', data.token);
          localStorage.setItem('precocerto_admin_user', JSON.stringify(data.usuario));
        }

        return { success: true };
      }

      return { success: false, message: data.erro || 'Credenciais inválidas.' };
    } catch (error) {
      return { success: false, message: 'Não foi possível conectar ao servidor backend.' };
    }
  }

  public logout(): void {
    this._token.set(null);
    this._currentUser.set(null);
    this._isAuthenticated.set(false);

    if (typeof window !== 'undefined') {
      localStorage.removeItem('precocerto_admin_token');
      localStorage.removeItem('precocerto_admin_user');
    }
  }
}

