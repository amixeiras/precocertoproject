import { Component, signal, effect, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Domain Models
import { Product, ProductCategory } from '@domain/product/models/product.entity';
import { Market } from '@domain/market/models/market.entity';

// Use Cases
import { SearchProductsUseCase } from '@application/product/use-cases/search-products.usecase';
import { GetFeaturedDealsUseCase } from '@application/product/use-cases/get-featured-deals.usecase';
import {
  GetEstablishmentsUseCase,
  EstablishmentWithFilteredOffers,
  EstablishmentSortOption,
} from '@application/market/use-cases/get-establishments.usecase';
import { ProductSortOption } from '@application/product/dto/search-products.query';

// Services & Components
import { RegionStateService } from '../../state/region-state.service';
import { ProductCardComponent } from '../../components/product-card/product-card';
import { EstablishmentCardComponent } from '../../components/establishment-card/establishment-card';
import { QuickComparatorComponent } from '../../components/quick-comparator/quick-comparator';
import { StoreFlyerModalComponent } from '../../components/store-flyer-modal/store-flyer-modal';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProductCardComponent,
    EstablishmentCardComponent,
    QuickComparatorComponent,
    StoreFlyerModalComponent,
  ],
  templateUrl: './home.html',
})
export class HomeComponent {
  protected readonly regionState = inject(RegionStateService);
  private readonly searchProductsUseCase = inject(SearchProductsUseCase);
  private readonly getFeaturedDealsUseCase = inject(GetFeaturedDealsUseCase);
  private readonly getEstablishmentsUseCase = inject(GetEstablishmentsUseCase);

  // Active Tab: 'establishments' (Estabelecimentos & Melhores Ofertas) or 'products' (Produtos & Ofertas)
  protected readonly activeTab = signal<'establishments' | 'products'>('establishments');

  // ==========================================
  // TAB 1: Estabelecimentos & Melhores Ofertas
  // ==========================================
  protected readonly establishmentSearchTerm = signal<string>('');
  protected readonly selectedEstablishmentCategory = signal<string>('all');
  protected readonly establishmentSortBy = signal<EstablishmentSortOption>('featured');
  protected readonly establishments = signal<EstablishmentWithFilteredOffers[]>([]);
  protected readonly isEstablishmentsLoading = signal<boolean>(false);
  protected readonly selectedFlyerMarket = signal<Market | null>(null);

  protected readonly establishmentCategories = [
    { id: 'all', label: 'Todas as Ofertas', icon: 'ph-squares-four' },
    { id: 'carnes', label: 'Carnes & Aves', icon: 'ph-cow' },
    { id: 'hortifruti', label: 'Hortifrúti', icon: 'ph-plant' },
    { id: 'mercearia', label: 'Mercearia', icon: 'ph-cooking-pot' },
    { id: 'bebidas', label: 'Bebidas', icon: 'ph-brand-coffee' },
    { id: 'laticinios', label: 'Laticínios', icon: 'ph-cheese' },
    { id: 'limpeza', label: 'Limpeza & Casa', icon: 'ph-sparkle' },
  ];

  // ==========================================
  // TAB 2: Produtos e Ofertas (original intact)
  // ==========================================
  protected readonly searchTerm = signal<string>('');
  protected readonly selectedCategory = signal<ProductCategory | 'Todas'>('Todas');
  protected readonly sortBy = signal<ProductSortOption>('cheapest');
  protected readonly onlyPromotions = signal<boolean>(false);

  protected readonly products = signal<Product[]>([]);
  protected readonly featuredDeals = signal<Product[]>([]);
  protected readonly isLoading = signal<boolean>(false);

  protected readonly categories: (ProductCategory | 'Todas')[] = [
    'Todas',
    'Mercearia',
    'Laticínios e Frios',
    'Carnes e Peixes',
    'Hortifrúti',
    'Limpeza',
    'Bebidas',
  ];

  protected readonly currentRegionId = computed(() => {
    return this.regionState.currentRegion()?.idValue ?? 'todas';
  });

  constructor() {
    // Reactive sync for Tab 1 (Estabelecimentos)
    effect(() => {
      this.regionState.refreshTrigger();
      const region = this.regionState.currentRegion();
      const term = this.establishmentSearchTerm();
      const cat = this.selectedEstablishmentCategory();
      const sort = this.establishmentSortBy();

      this.loadEstablishments(region ? region.idValue : 'todas', term, cat, sort);
    });

    // Reactive sync for Tab 2 (Produtos)
    effect(() => {
      this.regionState.refreshTrigger();
      const region = this.regionState.currentRegion();
      const term = this.searchTerm();
      const cat = this.selectedCategory();
      const sort = this.sortBy();
      const promoOnly = this.onlyPromotions();

      if (region) {
        this.loadProducts(region.idValue, term, cat, sort, promoOnly);
        this.loadFeaturedDeals(region.idValue);
      }
    });
  }

  // Tab 1 methods
  protected setEstablishmentCategory(catId: string): void {
    this.selectedEstablishmentCategory.set(catId);
  }

  protected setEstablishmentSort(value: string): void {
    this.establishmentSortBy.set(value as EstablishmentSortOption);
  }

  protected openFlyerModal(market: Market): void {
    this.selectedFlyerMarket.set(market);
  }

  protected closeFlyerModal(): void {
    this.selectedFlyerMarket.set(null);
  }

  protected resetEstablishmentFilters(): void {
    this.selectedEstablishmentCategory.set('all');
    this.establishmentSearchTerm.set('');
    this.establishmentSortBy.set('featured');
  }

  private async loadEstablishments(
    regionId: string,
    searchTerm: string,
    category: string,
    sortBy: EstablishmentSortOption
  ): Promise<void> {
    this.isEstablishmentsLoading.set(true);
    try {
      const list = await this.getEstablishmentsUseCase.execute({
        regionId,
        searchTerm,
        category,
        sortBy,
      });
      this.establishments.set(list);
    } catch (err) {
      console.error('Failed to load establishments', err);
    } finally {
      this.isEstablishmentsLoading.set(false);
    }
  }

  // Tab 2 methods (preserved)
  protected setCategory(cat: ProductCategory | 'Todas'): void {
    this.selectedCategory.set(cat);
  }

  protected setSortBy(sort: ProductSortOption): void {
    this.sortBy.set(sort);
  }

  protected togglePromotions(): void {
    this.onlyPromotions.update((prev) => !prev);
  }

  private async loadProducts(
    regionId: string,
    term: string,
    category: ProductCategory | 'Todas',
    sortBy: ProductSortOption,
    onlyPromotions: boolean
  ): Promise<void> {
    this.isLoading.set(true);
    try {
      const results = await this.searchProductsUseCase.execute({
        regionId,
        searchTerm: term,
        category,
        sortBy,
        onlyPromotions,
      });
      this.products.set(results);
    } catch (err) {
      console.error('Failed to search products', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadFeaturedDeals(regionId: string): Promise<void> {
    try {
      const deals = await this.getFeaturedDealsUseCase.execute(regionId, 4);
      this.featuredDeals.set(deals);
    } catch (err) {
      console.error('Failed to load featured deals', err);
    }
  }
}
