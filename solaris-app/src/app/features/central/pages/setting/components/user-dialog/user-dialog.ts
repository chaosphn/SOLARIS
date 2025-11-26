import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { User } from '../../../../models/billing.model';
import { SiteModel } from '../../../../../../shared/models/config.model';
import { Store } from '@ngrx/store';
import { getZoneConfig } from '../../../../../../store/selectors/site.selectors';

@Component({
  selector: 'app-user-dialog',
  standalone: false,
  templateUrl: './user-dialog.html',
  styleUrl: './user-dialog.scss'
})
export class UserDialog implements OnInit {
  
  userData = input<User>(this.getEmptyUser());
  pageList = input<string[]>([]);
  onClose = output();

  private nextUserId: number = 1;

  siteList = signal<SiteModel[]>([]);
  private store = inject(Store);
  constructor() {
  }

  ngOnInit(): void {
    this.store.select(getZoneConfig('CENTRAL1')).subscribe(zone => {
      if (zone) {
        this.siteList.set(zone.siteList);
      }
    });
    this.initializeMockData();
  }

  initializeMockData(): void {
    
  }

  // User Management Methods
  getEmptyUser(): User {
    return {
      id: 0,
      username: '',
      password: '',
      role: 'user',
      pageAccess: [],
      siteAccess: []
    };
  }

  closeUserModal(): void {
    this.onClose.emit();
  }

  togglePageAccess(page: string): void {
    const index = this.userData().pageAccess.indexOf(page);
    if (index > -1) {
      this.userData().pageAccess.splice(index, 1);
    } else {
      this.userData().pageAccess.push(page);
    }
  }

  hasPageAccess(page: string): boolean {
    return this.userData().pageAccess.includes(page);
  }

  selectAllPages(): void {
    this.userData().pageAccess = [...this.pageList()];
  }

  deselectAllPages(): void {
    this.userData().pageAccess = [];
  }

  toggleSiteAccess(site: string): void {
    const index = this.userData().siteAccess.indexOf(site);
    if (index > -1) {
      this.userData().siteAccess.splice(index, 1);
    } else {
      this.userData().siteAccess.push(site);
    }
  }

  hasSiteAccess(site: string): boolean {
    return this.userData().siteAccess.includes(site);
  }

  selectAllSites(): void {
    this.userData().siteAccess = [...this.siteList().map(site => site.id)];
  }

  deselectAllSites(): void {
    this.userData().siteAccess = [];
  }

  saveUser(): void {
    if (!this.userData().username.trim()) {
      alert('Please enter username');
      return;
    }

    if (!this.userData().password.trim()) {
      alert('Please enter password');
      return;
    }

    this.closeUserModal();
  }
}
