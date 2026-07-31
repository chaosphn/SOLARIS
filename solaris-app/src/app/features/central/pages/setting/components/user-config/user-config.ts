import { Component, computed, inject, OnInit, output, signal } from '@angular/core';
import { UserDataModel } from '../../../../../../shared/models/user.model';
import { PageDataModel } from '../../../../../../shared/models/page.model';
import { NotificationConfig } from '../notification-config/notification-config';
import { SiteModel, SiteStateModel } from '../../../../../../shared/models/config.model';
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
  showUserViewerModal: boolean = false;
  editingUser: UserDataModel | null = null;
  newUser: UserDataModel = this.getEmptyUser();

  availablePages: PageDataModel[] = [];

  siteList = signal<SiteModel[]>([]);
  
  userRole = signal<string>('user');

  pageSizeOptions: number[] = [10, 20, 50, 100];
  pageSize = signal<number>(10);
  currentPage = signal<number>(1);

  tableRowConfig = computed(() => {
    const end = this.currentPage() * this.pageSize();
    const start = end - this.pageSize();
    return this.users().slice(start, end);
  });

  totalRows = computed(() => this.users().length);
  totalPages = computed(() => {
    const total = this.totalRows();
    const size = this.pageSize();
    return Math.max(1, Math.ceil(total / Math.max(1, size)));
  });

  pageRangeText = computed(() => {
    const total = this.totalRows();
    if (total === 0) return '0–0 of 0';
    const size = Math.max(1, this.pageSize());
    const page = Math.min(Math.max(1, this.currentPage()), this.totalPages());
    const start = (page - 1) * size + 1;
    const end = Math.min(total, page * size);
    return `${start}–${end} of ${total}`;
  });

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
    const role = localStorage.getItem('role');
    if(role){
      this.userRole.set(role);
    }
    this.getSiteConfig();
    this.initializeUserData();
  }

  async initializeUserData() {
    const result = await this.service.getUserConfig();
    if (result) {
      this.users.set(result.filter(x => x.username && x.username != 'systemadmin'));
    } else {
      this.users.set([]);
    }
    this.availablePages = this.pgService.getPageList();
  }

  async getSiteConfig(){
    this.siteList.set(await this.service.getMasterSiteList());
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

  openUserViewerModal(user: UserDataModel): void {
    this.editingUser = user;
    this.newUser = { ...user };
    this.showUserViewerModal = true;
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

  setPageSizeFromEvent(ev: Event) {
    const value = Number((ev.target as HTMLSelectElement)?.value);
    const nextSize = Number.isFinite(value) && value > 0 ? value : 10;
    this.pageSize.set(nextSize);
    this.currentPage.set(1);
  }

  prevPage() {
    this.currentPage.update(p => Math.max(1, p - 1));
  }

  nextPage() {
    this.currentPage.update(p => Math.min(this.totalPages(), p + 1));
  }

  async closeUserModal(): Promise<void> {
    this.showUserModal = false;
    this.editingUser = null;
    this.newUser = this.getEmptyUser();
    await this.initializeUserData();
  }

  closeUserViewerModal(): void {
    this.showUserViewerModal = false;
    this.editingUser = null;
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
        await this.deleteUser(id);
      }
    });

  }
}
