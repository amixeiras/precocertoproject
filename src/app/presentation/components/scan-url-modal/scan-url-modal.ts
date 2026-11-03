import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { RegionStateService } from '../../state/region-state.service';

@Component({
  selector: 'app-scan-url-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scan-url-modal.html',
})
export class ScanUrlModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly close = output<void>();

  private readonly http = inject(HttpClient);
  protected readonly regionState = inject(RegionStateService);

  protected readonly targetUrl = signal<string>('https://www.shibata.com.br/ofertas');
  protected readonly marketName = signal<string>('Supermercado');
  protected readonly targetRegion = signal<string>('auto');
  protected readonly isScanning = signal<boolean>(false);
  protected readonly feedbackMessage = signal<string | null>(null);
  protected readonly feedbackType = signal<'success' | 'error' | null>(null);

  constructor() {
    // Mantém 'auto' como padrão para permitir que o robô detecte da página,
    // ou o usuário pode escolher uma região específica na lista suspensa.
  }

  protected async executeScan(): Promise<void> {
    const url = this.targetUrl().trim();
    if (!url || !url.startsWith('http')) {
      this.feedbackType.set('error');
      this.feedbackMessage.set('Por favor, informe uma URL válida iniciando com http:// ou https://');
      return;
    }

    this.isScanning.set(true);
    this.feedbackMessage.set(null);

    try {
      const response: any = await firstValueFrom(
        this.http.post('http://localhost:3001/api/coleta/url', {
          url,
          nomeMercado: this.marketName() || 'Supermercado',
          regiao: this.targetRegion() || 'auto',
        })
      );

      const regiaoFinal = response.regiao || (this.targetRegion() === 'auto' ? 'Detectada automaticamente' : this.targetRegion());

      this.feedbackType.set('success');
      this.feedbackMessage.set(
        `Sucesso! O robô Playwright varreu a página e extraiu ${response.totalExtraido} ofertas/produtos para a Região "${regiaoFinal}" salvos no banco SQLite!`
      );

      // Atualiza o estado da aplicação e a região ativa para refletir os novos dados escaneados
      if (response.regiao) {
        const matchingRegion = this.regionState.availableRegions().find(
          (r) => r.name.toLowerCase() === response.regiao.toLowerCase() || r.idValue.toLowerCase() === response.regiao.toLowerCase()
        );
        if (matchingRegion) {
          this.regionState.selectRegion(matchingRegion);
        }
      }
      this.regionState.notifyDataChanged();
    } catch {
      this.feedbackType.set('error');
      this.feedbackMessage.set(
        'Não foi possível conectar ao servidor do Playwright em http://localhost:3001. Certifique-se de que o backend foi iniciado com "npm run start:backend".'
      );
    } finally {
      this.isScanning.set(false);
    }
  }

  protected onClose(): void {
    this.feedbackMessage.set(null);
    this.close.emit();
  }
}
