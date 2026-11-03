import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '@domain/product/models/product.entity';
import { CurrencyBrlPipe } from '../../pipes/currency-brl.pipe';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyBrlPipe],
  templateUrl: './product-card.html',
})
export class ProductCardComponent {
  public readonly product = input.required<Product>();
}

