import { Routes } from '@angular/router';
import { adminAuthGuard } from './core/guards/admin-auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/pages/home/home').then((m) => m.HomeComponent),
    title: 'Preço Certo - Menor Preço nos Mercados por Região',
  },
  {
    path: 'produto/:id',
    loadComponent: () =>
      import('./presentation/pages/product-detail/product-detail').then(
        (m) => m.ProductDetailComponent
      ),
    title: 'Comparativo de Preços - Preço Certo',
  },
  {
    path: 'mercados',
    loadComponent: () =>
      import('./presentation/pages/markets/markets').then(
        (m) => m.MarketsComponent
      ),
    title: 'Supermercados por Região - Preço Certo',
  },
  {
    path: 'arquitetura',
    loadComponent: () =>
      import('./presentation/pages/architecture/architecture').then(
        (m) => m.ArchitectureComponent
      ),
    title: 'Arquitetura DDD, Clean Code & SOLID - Preço Certo',
  },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./presentation/pages/admin/login/admin-login').then(
        (m) => m.AdminLoginComponent
      ),
    title: 'Login Administrador - Preço Certo',
  },
  {
    path: 'admin',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./presentation/pages/admin/dashboard/admin-dashboard').then(
        (m) => m.AdminDashboardComponent
      ),
    title: 'Painel do Administrador - Preço Certo',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
