import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Market } from '@domain/market/models/market.entity';
import { MarketOffer } from '@domain/market/models/market-offer.entity';
import { CurrencyBrlPipe } from '../../pipes/currency-brl.pipe';

@Component({
  selector: 'app-establishment-card',
  standalone: true,
  imports: [CommonModule, CurrencyBrlPipe],
  templateUrl: './establishment-card.html',
})
export class EstablishmentCardComponent {
  public readonly market = input.required<Market>();
  public readonly offers = input<MarketOffer[]>([]);
  public readonly openFlyer = output<Market>();

  protected get displayedOffers(): MarketOffer[] {
    const list = this.offers();
    if (list && list.length > 0) {
      return list.slice(0, 5);
    }
    return this.market().getTopOffers(5);
  }

  protected onViewFlyer(): void {
    this.openFlyer.emit(this.market());
  }

  protected get encodedMapsUrl(): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      this.market().mapsQuery
    )}`;
  }
}

