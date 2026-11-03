import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ScanMarketComponent } from '../../../components/scan-market/scan-market';
import { RegionStateService } from '../../../state/region-state.service';

export interface AdminMarketItem {
  id: string;
  nome: string;
  rede: string;
  regiao: string;
  regiaoId?: string;
  endereco?: string;
  flyerUrl?: string;
  topOfertas?: any[];
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ScanMarketComponent],
  templateUrl: './admin-dashboard.html',
})
export class AdminDashboardComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly regionState = inject(RegionStateService);

  protected readonly markets = signal<AdminMarketItem[]>([]);
  protected readonly isLoading = signal<boolean>(false);
  protected readonly searchTerm = signal<string>('');

  // Modais de Controle
  protected readonly isScanModalOpen = signal<boolean>(false);
  protected readonly isEditModalOpen = signal<boolean>(false);
  protected readonly editingId = signal<string>('');
  protected readonly editingName = signal<string>('');
  protected readonly isSavingEdit = signal<boolean>(false);

  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly deletingMarket = signal<AdminMarketItem | null>(null);
  protected readonly isDeleting = signal<boolean>(false);

  protected readonly notification = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  public ngOnInit(): void {
    this.loadMarkets();
  }

  protected async loadMarkets(): Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await fetch('http://localhost:3001/api/mercados');
      if (response.ok) {
        const json = await response.json();
        this.markets.set(json.dados || []);
      }
    } catch {
      this.showNotification('error', 'Falha ao carregar estabelecimentos do banco de dados.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected filteredMarkets(): AdminMarketItem[] {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.markets();

    return this.markets().filter(
      (m) =>
        m.id.toLowerCase().includes(term) ||
        m.nome.toLowerCase().includes(term) ||
        m.regiao?.toLowerCase().includes(term)
    );
  }

  // Escanear URL
  protected openScanModal(): void {
    this.isScanModalOpen.set(true);
  }

  protected closeScanModal(): void {
    this.isScanModalOpen.set(false);
  }

  protected onScanCompleted(): void {
    this.loadMarkets();
    this.regionState.notifyDataChanged();
    this.showNotification('success', 'Varredura concluída! Novos dados salvos no SQLite.');
  }

  // Edição de Estabelecimento
  protected openEditModal(market: AdminMarketItem): void {
    this.editingId.set(market.id);
    this.editingName.set(market.nome);
    this.isEditModalOpen.set(true);
  }

  protected closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.editingId.set('');
    this.editingName.set('');
  }

  protected async saveEdit(): Promise<void> {
    const id = this.editingId();
    const nome = this.editingName().trim();

    if (!nome) {
      this.showNotification('error', 'A descrição do estabelecimento não pode ficar vazia.');
      return;
    }

    this.isSavingEdit.set(true);
    try {
      const response = await fetch(`http://localhost:3001/api/mercados/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome }),
      });

      const data = await response.json();

      if (response.ok && data.sucesso) {
        this.showNotification('success', 'Descrição do estabelecimento atualizada com sucesso no SQLite!');
        this.closeEditModal();
        await this.loadMarkets();
        this.regionState.notifyDataChanged();
      } else {
        this.showNotification('error', data.erro || 'Falha ao atualizar estabelecimento.');
      }
    } catch {
      this.showNotification('error', 'Erro ao conectar com o servidor.');
    } finally {
      this.isSavingEdit.set(false);
    }
  }

  // Exclusão de Estabelecimento
  protected openDeleteModal(market: AdminMarketItem): void {
    this.deletingMarket.set(market);
    this.isDeleteModalOpen.set(true);
  }

  protected closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.deletingMarket.set(null);
  }

  protected async confirmDelete(): Promise<void> {
    const market = this.deletingMarket();
    if (!market) return;

    this.isDeleting.set(true);
    try {
      const response = await fetch(`http://localhost:3001/api/mercados/${encodeURIComponent(market.id)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.sucesso) {
        this.showNotification(
          'success',
          `Estabelecimento "${market.nome}" e suas ofertas excluídos com sucesso. Catálogo de produtos preservado!`
        );
        this.closeDeleteModal();
        await this.loadMarkets();
        this.regionState.notifyDataChanged();
      } else {
        this.showNotification('error', data.erro || 'Falha ao excluir estabelecimento.');
      }
    } catch {
      this.showNotification('error', 'Erro ao conectar com o servidor.');
    } finally {
      this.isDeleting.set(false);
    }
  }

  protected logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }

  private showNotification(type: 'success' | 'error', text: string): void {
    this.notification.set({ type, text });
    setTimeout(() => {
      this.notification.set(null);
    }, 4500);
  }
}
