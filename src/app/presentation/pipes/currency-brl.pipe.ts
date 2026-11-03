import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats numeric values to Brazilian Real (R$).
 */
@Pipe({
  name: 'currencyBrl',
  standalone: true,
})
export class CurrencyBrlPipe implements PipeTransform {
  transform(value: number | undefined | null): string {
    if (value === undefined || value === null || isNaN(value)) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }
}

