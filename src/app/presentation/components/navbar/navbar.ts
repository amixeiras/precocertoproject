import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { RegionStateService } from '../../state/region-state.service';
import { RegionModalComponent } from '../region-modal/region-modal';
import { ScanUrlModalComponent } from '../scan-url-modal/scan-url-modal';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RegionModalComponent,
    ScanUrlModalComponent,
  ],
  templateUrl: './navbar.html',
})
export class NavbarComponent {
  protected readonly regionState = inject(RegionStateService);
  protected readonly authService = inject(AuthService);
  protected readonly isModalOpen = signal<boolean>(false);
  protected readonly isScanModalOpen = signal<boolean>(false);

  protected openRegionModal(): void {
    this.isModalOpen.set(true);
  }

  protected closeRegionModal(): void {
    this.isModalOpen.set(false);
  }

  protected openScanModal(): void {
    this.isScanModalOpen.set(true);
  }

  protected closeScanModal(): void {
    this.isScanModalOpen.set(false);
  }
}
