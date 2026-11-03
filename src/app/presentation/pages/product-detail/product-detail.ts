import { Component, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product } from '@domain/product/models/product.entity';
import { PriceOffer } from '@domain/product/models/price-offer.entity';
import { GetProductDetailsUseCase } from '@application/product/use-cases/get-product-details.usecase';
import { RegionStateService } from '../../state/region-state.service';
import { CurrencyBrlPipe } from '../../pipes/currency-brl.pipe';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyBrlPipe],
  templateUrl: './product-detail.html',
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly getProductDetailsUseCase = inject(GetProductDetailsUseCase);
  protected readonly regionState = inject(RegionStateService);

  protected readonly product = signal<Product | null>(null);
  protected readonly sortedOffers = signal<PriceOffer[]>([]);
  protected readonly isLoading = signal<boolean>(true);
  protected readonly notFound = signal<boolean>(false);

  constructor() {
    effect(() => {
      const region = this.regionState.currentRegion();
      const id = this.route.snapshot.paramMap.get('id');

      if (id && region) {
        this.loadDetails(id, region.idValue);
      }
    });
  }

  private async loadDetails(id: string, regionId: string): Promise<void> {
    this.isLoading.set(true);
    this.notFound.set(false);

    try {
      const prod = await this.getProductDetailsUseCase.execute(id, regionId);
      if (prod) {
        this.product.set(prod);
        this.sortedOffers.set(prod.getOffersSortedByPrice());
      } else {
        this.notFound.set(true);
      }
    } catch {
      this.notFound.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }
}

