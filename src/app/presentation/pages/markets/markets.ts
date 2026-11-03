import { Component, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GetMarketsByRegionUseCase, MarketWithDistance } from '@application/market/use-cases/get-markets-by-region.usecase';
import { Region } from '@domain/region/models/region.entity';
import { Market } from '@domain/market/models/market.entity';
import { RegionStateService } from '../../state/region-state.service';
import { MarketCardComponent } from '../../components/market-card/market-card';
import { StoreFlyerModalComponent } from '../../components/store-flyer-modal/store-flyer-modal';

@Component({
  selector: 'app-markets',
  standalone: true,
  imports: [CommonModule, FormsModule, MarketCardComponent, StoreFlyerModalComponent],
  templateUrl: './markets.html',
})
export class MarketsComponent {
  private readonly getMarketsByRegionUseCase = inject(GetMarketsByRegionUseCase);
  protected readonly regionState = inject(RegionStateService);

  protected readonly markets = signal<MarketWithDistance[]>([]);
  protected readonly filterTerm = signal<string>('');
  protected readonly isLoading = signal<boolean>(false);
  protected readonly selectedFlyerMarket = signal<Market | null>(null);

  constructor() {
    effect(() => {
      // Reagir à mudança de região e ao gatilho de dados atualizados
      this.regionState.refreshTrigger();
      const region = this.regionState.currentRegion();
      this.loadMarkets(region ? region.idValue : 'todas');
    });
  }

  protected async loadMarkets(regionId: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const list = await this.getMarketsByRegionUseCase.execute(regionId);
      this.markets.set(list);
    } catch (err) {
      console.error('Failed to load markets', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected selectRegion(region: Region): void {
    this.regionState.selectRegion(region);
  }

  protected isSelectedRegion(region: Region): boolean {
    const current = this.regionState.currentRegion();
    if (!current) {
      return region.idValue === 'todas';
    }
    return (
      current.idValue.toLowerCase() === region.idValue.toLowerCase() ||
      current.name.toLowerCase() === region.name.toLowerCase()
    );
  }

  protected openFlyerModal(market: Market): void {
    this.selectedFlyerMarket.set(market);
  }

  protected closeFlyerModal(): void {
    this.selectedFlyerMarket.set(null);
  }

  protected clearFilters(): void {
    this.filterTerm.set('');
    const todas = this.regionState.availableRegions().find((r) => r.idValue === 'todas');
    if (todas) {
      this.regionState.selectRegion(todas);
    }
  }

  protected filteredMarkets(): MarketWithDistance[] {
    const term = this.filterTerm().toLowerCase().trim();
    if (!term) return this.markets();

    return this.markets().filter(
      (m) =>
        m.market.name.toLowerCase().includes(term) ||
        m.market.chainName.toLowerCase().includes(term) ||
        m.market.address.neighborhood.toLowerCase().includes(term) ||
        m.market.address.street.toLowerCase().includes(term) ||
        m.market.regionName?.toLowerCase().includes(term)
    );
  }
}
