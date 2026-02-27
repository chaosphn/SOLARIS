import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { User } from '../../../../models/billing.model';
import { SiteModel } from '../../../../../../shared/models/config.model';
import { Store } from '@ngrx/store';
import { getZoneConfig } from '../../../../../../store/selectors/site.selectors';
import { ChnagePasswordRequestModel, UserDataModel } from '../../../../../../shared/models/user.model';
import { PageDataModel } from '../../../../../../shared/models/page.model';
import { HttpService } from '../../../../../../shared/services/http.service';
import { sendMessage } from '../../../../../../store/actions/toaster.actions';

@Component({
  selector: 'app-user-dialog',
  standalone: false,
  templateUrl: './user-dialog.html',
  styleUrl: './user-dialog.scss'
})
export class UserDialog implements OnInit {
  
  userList = input<UserDataModel[]>([]);
  userData = input<UserDataModel>(this.getEmptyUser());
  pageList = input<PageDataModel[]>([]);
  newPassword: string = '';
  confirmPassword: string = '';
  onClose = output();

  private nextUserId: number = 1;

  siteList = signal<SiteModel[]>([]);
  private store = inject(Store);
  private service = inject(HttpService);
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
  getEmptyUser(): UserDataModel {
    return {
      _id: '',
      username: '',
      password: '',
      Group: 'user',
      pageAccess: [],
      siteAccess: [],
      firstName: '',
      lastName: ''
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
    this.userData().pageAccess = this.pageList().flatMap(page => page.page.map(p => p.path));
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

  async chnagePassword(oldPassword: string, newPassword: string) {
    if (!oldPassword.trim()) {
      this.store.dispatch(sendMessage({ payload: { text: 'Please enter old password', type: 'warn' } }));
      return;
    }
    if (!newPassword.trim()) {
      this.store.dispatch(sendMessage({ payload: { text: 'Please enter new password', type: 'warn' } }));
      return;
    }

    const body: ChnagePasswordRequestModel = {
      _id: this.userData()._id,
      oldpassword: oldPassword,
      newpassword: newPassword
    };
    const response = await this.service.updatePassword(body);
    if (response && response.success) {
      this.store.dispatch(sendMessage({ payload: { text: 'Password changed successfully', type: 'success' } }));
    } else {
      this.store.dispatch(sendMessage({ payload: { text: 'Failed to change password', type: 'error' } }));
    }
  };

  async saveUser() {
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

  async addUserSubmit() {
    if(!this.userData()._id) {
      if (!this.userData().password.trim()) {
        this.store.dispatch(sendMessage({ payload: { text: 'Please enter password', type: 'warn' } }));
        return;
      }
      if (!this.userData().username.trim()) {
        this.store.dispatch(sendMessage({ payload: { text: 'Please enter username', type: 'warn' } }));
        return;
      }
      if (!this.userData().Group.trim()) {
        this.store.dispatch(sendMessage({ payload: { text: 'Please select role', type: 'warn' } }));
        return;
      }
      if (this.userData().pageAccess.length === 0) {
        this.store.dispatch(sendMessage({ payload: { text: 'Please select page access', type: 'warn' } }));
        return;
      }
      if(this.userList().findIndex(u => u.username === this.userData().username) !== -1) {
        this.store.dispatch(sendMessage({ payload: { text: 'User already exists', type: 'warn' } }));
        return;
      }

      const body = {
        username: this.userData().username,
        password: this.userData().password,
        Group: this.userData().Group,
        pageAccess: this.userData().pageAccess,
        siteAccess: this.userData().siteAccess,
        firstName: this.userData().firstName,
        lastName: this.userData().lastName
      };
      const response = await this.service.addUserConfig(body);
      if (response && response.success) {
        this.store.dispatch(sendMessage({ payload: { text: 'User added successfully', type: 'success' } }));
        this.closeUserModal();
      } else {
        this.store.dispatch(sendMessage({ payload: { text: 'Failed to add user', type: 'error' } }));
      }
    }
  }

  async editUserSubmit() {
    if(this.userData()._id) {
      if (!this.userData().username.trim()) {
        this.store.dispatch(sendMessage({ payload: { text: 'Please enter username', type: 'error' } }));
        return;
      }
      
      // if(this.userList().findIndex(u => u.username === this.userData().username) !== -1) {
      //   this.store.dispatch(sendMessage({ payload: { text: 'User already exists', type: 'warn' } }));
      //   return;
      // }
      
      const body = {
        _id: this.userData()._id,
        username: this.userData().username,
        password: this.userData().password,
        Group: this.userData().Group,
        pageAccess: this.userData().pageAccess,
        siteAccess: this.userData().siteAccess,
        firstName: this.userData().firstName,
        lastName: this.userData().lastName
      };
      const response = await this.service.updateUserConfig(body);
      if (response && response.success) {
        this.store.dispatch(sendMessage({ payload: { text: 'User updated successfully', type: 'success' } }));
        this.closeUserModal();
      } else {
        this.store.dispatch(sendMessage({ payload: { text: 'Failed to update user', type: 'error' } }));
      }
    }
  }



}