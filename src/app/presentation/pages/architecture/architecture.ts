import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-architecture',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './architecture.html',
})
export class ArchitectureComponent {
  protected readonly activeTab = signal<'ddd' | 'solid' | 'cleancode'>('ddd');

  protected setTab(tab: 'ddd' | 'solid' | 'cleancode'): void {
    this.activeTab.set(tab);
  }
}

