import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-login.html',
})
export class AdminLoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly username = signal<string>('admin');
  protected readonly password = signal<string>('');
  protected readonly showPassword = signal<boolean>(false);
  protected readonly isLoading = signal<boolean>(false);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    // Se já estiver logado, redireciona direto para o painel admin
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/admin']);
    }
  }

  protected async onSubmit(): Promise<void> {
    const user = this.username().trim();
    const pass = this.password().trim();

    if (!user || !pass) {
      this.errorMessage.set('Por favor, informe o usuário e a senha.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const result = await this.authService.login(user, pass);
    this.isLoading.set(false);

    if (result.success) {
      this.router.navigate(['/admin']);
    } else {
      this.errorMessage.set(result.message || 'Falha ao autenticar.');
    }
  }
}

