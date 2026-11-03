import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats distance in km or meters.
 */
@Pipe({
  name: 'distance',
  standalone: true,
})
export class DistancePipe implements PipeTransform {
  transform(valueKm: number | undefined | null): string {
    if (valueKm === undefined || valueKm === null || isNaN(valueKm)) {
      return '';
    }
    if (valueKm < 1) {
      return `${Math.round(valueKm * 1000)} m`;
    }
    return `${valueKm.toFixed(1).replace('.', ',')} km`;
  }
}

