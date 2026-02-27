import { Component, inject, OnInit, output, signal } from '@angular/core';
import { UserDataModel } from '../../../../../../shared/models/user.model';
import { PageDataModel } from '../../../../../../shared/models/page.model';
import { NotificationConfig } from '../notification-config/notification-config';
import { SiteModel } from '../../../../../../shared/models/config.model';
import { Store } from '@ngrx/store';
import { FloatingDialogService } from '../../../../../../shared/pipes/floating-dialog.service';
import { HttpService } from '../../../../../../shared/services/http.service';
import { PagesService } from '../../../../../../shared/services/pages.service';
import { getZoneConfig } from '../../../../../../store/selectors/site.selectors';
import { sendMessage } from '../../../../../../store/actions/toaster.actions';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog, ConfirmDialogData } from '../../../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-user-config',
  standalone: false,
  templateUrl: './user-config.html',
  styleUrl: './user-config.scss'
})
export class UserConfig implements OnInit {

  // User Management
  users = signal<UserDataModel[]>([]);
  showUserModal: boolean = false;
  editingUser: UserDataModel | null = null;
  newUser: UserDataModel = this.getEmptyUser();

  availablePages: PageDataModel[] = [];

  siteList = signal<SiteModel[]>([]);

  addUserEvent = output<null>();
  editUserEvent = output<UserDataModel>();
  deleteUserEvent = output<string>();

  private store = inject(Store);
  private dialog = inject(MatDialog);
  private service = inject(HttpService);
  private pgService = inject(PagesService);

  constructor() {
  }

  ngOnInit(): void {
    this.store.select(getZoneConfig('CENTRAL1')).subscribe(zone => {
      if (zone) {
        this.siteList.set(zone.siteList);
      }
    });
    this.initializeUserData();
  }

  async initializeUserData() {
    const result = await this.service.getUserConfig();
    if (result) {
      this.users.set(result);
    } else {
      this.users.set([]);
    }
    this.availablePages = this.pgService.getPageList();
  }

  openAddUserModal(): void {
    this.editingUser = null;
    this.newUser = this.getEmptyUser();
    this.showUserModal = true;
  }
  
  openEditUserModal(user: UserDataModel): void {
    this.editingUser = user;
    this.newUser = { ...user, pageAccess: [...user.pageAccess] };
    this.showUserModal = true;
  }
  
  async deleteUser(id: string): Promise<void> {
      const response = await this.service.deleteUserConfig(id);
      if (response && response.success) {
        this.store.dispatch(sendMessage({ payload: { text: 'User deleted successfully', type: 'success' } }));
      } else {
        this.store.dispatch(sendMessage({ payload: { text: 'Failed to delete user', type: 'error' } }));
      }
      await this.initializeUserData();
  }

  saveUserChanges(): void {
    console.log('Saving all user changes:', this.users);
    alert('User changes saved successfully!');
  }

  getSiteNameById(siteId: string): string {
    const site = this.siteList().find(s => s.id === siteId);
    return site ? site.name : siteId;
  }

  getPageNameById(pageId: string): string {
    const page = this.availablePages.flatMap(p => p.page).find(p => p.path === pageId);
    return page ? page.name : pageId;
  }

  getEmptyUser(): UserDataModel {
    return {
      _id: '',
      username: '',
      password: '',
      Group: '',
      pageAccess: [],
      siteAccess: [],
      firstName: '',
      lastName: ''
    };
  }

  async closeUserModal(): Promise<void> {
    this.showUserModal = false;
    this.editingUser = null;
    this.newUser = this.getEmptyUser();
    await this.initializeUserData();
  }

  confirmDeleteUser(id: string): void {
    const dialogData: ConfirmDialogData = {
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item?',
      subMessage: 'This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    };

    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '480px',
      data: dialogData,
      panelClass: 'confirm-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === true) {
        //console.log('User confirmed deletion of user with id:', id);
        await this.deleteUser(id);
      }
    });

  }
}
