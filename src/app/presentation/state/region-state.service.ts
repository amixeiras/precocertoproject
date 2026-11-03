import { Injectable, signal, computed, inject } from '@angular/core';
import { Region } from '@domain/region/models/region.entity';
import { GetAvailableRegionsUseCase } from '@application/region/use-cases/get-available-regions.usecase';
import { DetectUserRegionUseCase } from '@application/region/use-cases/detect-user-region.usecase';

/**
 * Presentation State Service using modern Angular 22 Signals.
 * Manages the globally selected region across pages and components.
 */
@Injectable({
  providedIn: 'root',
})
export class RegionStateService {
  private readonly getAvailableRegionsUseCase = inject(GetAvailableRegionsUseCase);
  private readonly detectUserRegionUseCase = inject(DetectUserRegionUseCase);

  private readonly _currentRegion = signal<Region | null>(null);
  private readonly _availableRegions = signal<Region[]>([]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _isDetecting = signal<boolean>(false);
  private readonly _errorMessage = signal<string | null>(null);
  private readonly _refreshTrigger = signal<number>(0);

  // Readonly signals exposed to presentation
  public readonly currentRegion = this._currentRegion.asReadonly();
  public readonly availableRegions = this._availableRegions.asReadonly();
  public readonly isLoading = this._isLoading.asReadonly();
  public readonly isDetecting = this._isDetecting.asReadonly();
  public readonly errorMessage = this._errorMessage.asReadonly();
  public readonly refreshTrigger = this._refreshTrigger.asReadonly();

  public readonly regionName = computed(() => {
    const reg = this._currentRegion();
    return reg ? reg.displayName : 'Selecionar Região';
  });

  public notifyDataChanged(): void {
    this._refreshTrigger.update((v) => v + 1);
  }

  constructor() {
    this.initializeRegions();
  }

  public async initializeRegions(): Promise<void> {
    this._isLoading.set(true);
    try {
      const regions = await this.getAvailableRegionsUseCase.execute();
      this._availableRegions.set(regions);

      // Check saved region in localStorage
      const savedId = typeof window !== 'undefined' ? localStorage.getItem('precocerto_region_id') : null;
      const found = savedId ? regions.find((r) => r.idValue === savedId) : null;

      if (found) {
        this._currentRegion.set(found);
      } else if (regions.length > 0) {
        this.selectRegion(regions[0]);
      }
    } catch {
      this._errorMessage.set('Falha ao carregar regiões disponíveis.');
    } finally {
      this._isLoading.set(false);
    }
  }

  public selectRegion(region: Region): void {
    this._currentRegion.set(region);
    this._errorMessage.set(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('precocerto_region_id', region.idValue);
    }
  }

  public async detectLocation(): Promise<boolean> {
    this._isDetecting.set(true);
    this._errorMessage.set(null);

    const result = await this.detectUserRegionUseCase.execute();

    this._isDetecting.set(false);

    if (result.isSuccess) {
      this.selectRegion(result.getValue());
      return true;
    } else {
      this._errorMessage.set(result.getError());
      return false;
    }
  }
}

