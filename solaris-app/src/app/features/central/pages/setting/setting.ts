import { Component, inject, OnInit, signal } from '@angular/core';
import { AlarmTag, NotificationConfig, User } from '../../models/billing.model';
import { ExampleAlarmTags, ExampleNotification, ExampleUsers } from '../../../../mockup/setting';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { SiteModel, SiteStateModel } from '../../../../shared/models/config.model';
import { getSiteConfig, getZoneConfig, selectSiteState } from '../../../../store/selectors/site.selectors';
import { FloatingDialogService } from '../../../../shared/pipes/floating-dialog.service';
import { UserDataModel } from '../../../../shared/models/user.model';
import { HttpService } from '../../../../shared/services/http.service';
import { PageDataModel } from '../../../../shared/models/page.model';
import { PagesService } from '../../../../shared/services/pages.service';
import { sendMessage } from '../../../../store/actions/toaster.actions';

@Component({
  selector: 'app-setting',
  standalone: false,
  templateUrl: './setting.html',
  styleUrl: './setting.scss'
})
export class Setting implements OnInit {
  // User Management
  users: UserDataModel[] = [];
  showUserModal: boolean = false;
  editingUser: UserDataModel | null = null;
  newUser: UserDataModel = this.getEmptyUser();

  // Alarm Management
  editedTags: AlarmTag[] = [];
  expandedIndex: number = -1;
  showAlarmModal: boolean = false;
  newAlarmTag: AlarmTag = this.getEmptyAlarmTag();

  availablePages: PageDataModel[] = [];

  // Notification Configuration
  notificationConfig: NotificationConfig = {
    telegram: {
      enabled: false,
      chatIds: [],
      display: false
    },
    msteam: {
      enabled: false,
      webhookUrls: [],
      display: false
    },
    email: {
      enabled: false,
      address: [],
      display: false
    }
  };

  // Temp inputs for adding items
  newTelegramChatId: string = '';
  newMsteamWebhook: string = '';
  newEmailAddress: string = '';

  private nextUserId: number = 1;
  private nextAlarmId: number = 1;

  tabMode: 'user' | 'notification' | 'alarm' = 'user';

  siteList = signal<SiteModel[]>([]);
  private store = inject(Store);
  private dialog = inject(FloatingDialogService);
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
    this.editedTags = ExampleAlarmTags;
    this.notificationConfig = ExampleNotification;
    this.initializeUserData();
  }

  changeTabs(name: 'user' | 'notification' | 'alarm'): void {
    this.tabMode = name;
  }

  async initializeUserData() {
    const result = await this.service.getUserConfig();
    if (result) {
      this.users = result;
    };
    this.availablePages = this.pgService.getPageList();
  }

  // User Management Methods
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

  openAddUserModal(): void {
    this.editingUser = null;
    this.newUser = this.getEmptyUser();
    this.showUserModal = true;
  }

  openEditUserModal(user: UserDataModel | any): void {
    console.log('Editing user:', user);
    this.editingUser = user;
    this.newUser = { ...user, pageAccess: [...user.pageAccess] };
    this.showUserModal = true;
  }

  saveUserChanges(): void {
    console.log('Saving all user changes:', this.users);
    alert('User changes saved successfully!');
  }

  async deleteUser(id: string | any): Promise<void> {
    console.log('Deleting user with id:', id);
    if (confirm('Are you sure you want to delete this user?')) {
      const response = await this.service.deleteUserConfig(id);
      if (response && response.success) {
        this.store.dispatch(sendMessage({ payload: { text: 'User deleted successfully', type: 'success' } }));
      } else {
        this.store.dispatch(sendMessage({ payload: { text: 'Failed to delete user', type: 'error' } }));
      }
      await this.initializeUserData();
    }
  }

  async closeUserModal(): Promise<void> {
    this.showUserModal = false;
    this.editingUser = null;
    this.newUser = this.getEmptyUser();
    await this.initializeUserData();
  }

  setDisplayItem(key: keyof NotificationConfig) {
    this.notificationConfig[key].display = !this.notificationConfig[key].display;
  }

  // Alarm Management Methods
  getEmptyAlarmTag(): AlarmTag {
    return {
      id: 0,
      name: '',
      description: '',
      message: '',
      expression: '',
      tagSync: '',
      destination: {
        telegram: false,
        msteam: false,
        email: false
      }
    };
  }


  getSiteNameById(siteId: string): string {
    const site = this.siteList().find(s => s.id === siteId);
    return site ? site.name : siteId;
  }

  getPageNameById(pageId: string): string {
    const page = this.availablePages.flatMap(p => p.page).find(p => p.path === pageId);
    return page ? page.name : pageId;
  }

  toggleAccordion(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? -1 : index;
  }

  openNewAlarmModal(): void {
    this.newAlarmTag = this.getEmptyAlarmTag();
    this.showAlarmModal = true;
  }

  closeAlarmModal(): void {
    this.showAlarmModal = false;
    this.newAlarmTag = this.getEmptyAlarmTag();
  }

  saveNewAlarm(): void {
    if (!this.newAlarmTag.name.trim()) {
      alert('Please enter alarm name');
      return;
    }

    this.newAlarmTag.id = this.nextAlarmId++;
    this.editedTags.push({ ...this.newAlarmTag });
    alert('Alarm added successfully!');
    this.closeAlarmModal();
  }

  deleteTag(index: number): void {
    if (confirm('Are you sure you want to delete this alarm?')) {
      this.editedTags.splice(index, 1);
    }
  }

  saveAlarmChanges(): void {
    console.log('Saving alarm changes:', this.editedTags);
    console.log('Saving notification config:', this.notificationConfig);
    alert('Alarm changes saved successfully!');
  }

  // Notification Config Methods
  addTelegramChatId(): void {
    const chatId = this.newTelegramChatId.trim();
    if (chatId && !this.notificationConfig.telegram.chatIds.includes(chatId)) {
      this.notificationConfig.telegram.chatIds.push(chatId);
      this.newTelegramChatId = '';
    }
  }

  removeTelegramChatId(chatId: string): void {
    this.notificationConfig.telegram.chatIds = 
      this.notificationConfig.telegram.chatIds.filter(id => id !== chatId);
  }

  addMsteamWebhook(): void {
    const webhook = this.newMsteamWebhook.trim();
    if (webhook && !this.notificationConfig.msteam.webhookUrls.includes(webhook)) {
      this.notificationConfig.msteam.webhookUrls.push(webhook);
      this.newMsteamWebhook = '';
    }
  }

  removeMsteamWebhook(webhook: string): void {
    this.notificationConfig.msteam.webhookUrls = 
      this.notificationConfig.msteam.webhookUrls.filter(url => url !== webhook);
  }

  addEmailAddress(): void {
    const email = this.newEmailAddress.trim();
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && emailRegex.test(email)) {
      if (!this.notificationConfig.email.address.includes(email)) {
        this.notificationConfig.email.address.push(email);
        this.newEmailAddress = '';
      } else {
        alert('This email address is already added');
      }
    } else if (email) {
      alert('Please enter a valid email address');
    }
  }

  removeEmailAddress(email: string): void {
    this.notificationConfig.email.address = 
      this.notificationConfig.email.address.filter(addr => addr !== email);
  }

  openDialog() {
    this.dialog.open('tag-dialog');
  }

}
