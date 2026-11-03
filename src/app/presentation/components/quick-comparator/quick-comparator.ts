import { Component, input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuickCompareUseCase, QuickCompareResult } from '@application/market/use-cases/quick-compare.usecase';
import { CurrencyBrlPipe } from '../../pipes/currency-brl.pipe';

@Component({
  selector: 'app-quick-comparator',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyBrlPipe],
  templateUrl: './quick-comparator.html',
})
export class QuickComparatorComponent {
  public readonly regionId = input<string>('todas');
  private readonly quickCompareUseCase = inject(QuickCompareUseCase);

  protected readonly queryInput = signal<string>('');
  protected readonly compareResult = signal<QuickCompareResult | null>(null);
  protected readonly hasSearched = signal<boolean>(false);
  protected readonly isSearching = signal<boolean>(false);

  protected readonly suggestions = [
    'Café 500g',
    'Arroz Tipo 1 5kg',
    'Picanha Bovina kg',
    'Leite Integral',
    'Heineken',
  ];

  protected async executeCompare(): Promise<void> {
    const term = this.queryInput().trim();
    if (!term) return;

    this.isSearching.set(true);
    this.hasSearched.set(true);

    try {
      const result = await this.quickCompareUseCase.execute(term, this.regionId());
      this.compareResult.set(result);
    } catch (err) {
      console.error('Error during quick compare', err);
    } finally {
      this.isSearching.set(false);
    }
  }

  protected setSuggestion(suggestion: string): void {
    this.queryInput.set(suggestion);
    this.executeCompare();
  }
}

