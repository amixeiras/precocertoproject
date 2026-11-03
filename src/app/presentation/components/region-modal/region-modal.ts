import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Region } from '@domain/region/models/region.entity';
import { RegionStateService } from '../../state/region-state.service';

@Component({
  selector: 'app-region-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './region-modal.html',
})
export class RegionModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly close = output<void>();

  protected readonly regionState = inject(RegionStateService);

  protected onSelect(region: Region): void {
    this.regionState.selectRegion(region);
    this.close.emit();
  }

  protected async onDetect(): Promise<void> {
    const success = await this.regionState.detectLocation();
    if (success) {
      this.close.emit();
    }
  }

  protected onClose(): void {
    this.close.emit();
  }
}

