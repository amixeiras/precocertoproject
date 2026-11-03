import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketWithDistance } from '@application/market/use-cases/get-markets-by-region.usecase';
import { Market } from '@domain/market/models/market.entity';
import { DistancePipe } from '../../pipes/distance.pipe';

@Component({
  selector: 'app-market-card',
  standalone: true,
  imports: [CommonModule, DistancePipe],
  templateUrl: './market-card.html',
})
export class MarketCardComponent {
  public readonly item = input.required<MarketWithDistance>();
  public readonly openFlyer = output<Market>();

  protected encodeQuery(query: string): string {
    return encodeURIComponent(query);
  }
}

