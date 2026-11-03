import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Market } from '@domain/market/models/market.entity';
import { CurrencyBrlPipe } from '../../pipes/currency-brl.pipe';

@Component({
  selector: 'app-store-flyer-modal',
  standalone: true,
  imports: [CommonModule, CurrencyBrlPipe],
  templateUrl: './store-flyer-modal.html',
})
export class StoreFlyerModalComponent {
  public readonly market = input<Market | null>(null);
  public readonly close = output<void>();

  protected onClose(): void {
    this.close.emit();
  }
}

