import { Component, OnInit } from '@angular/core';
import { AlarmTag, NotificationConfig, User } from '../../models/billing.model';
import { ExampleAlarmTags, ExampleNotification, ExampleUsers } from '../../../../mockup/setting';

@Component({
  selector: 'app-setting',
  standalone: false,
  templateUrl: './setting.html',
  styleUrl: './setting.scss'
})
export class Setting implements OnInit {
  // User Management
  users: User[] = [];
  showUserModal: boolean = false;
  editingUser: User | null = null;
  newUser: User = this.getEmptyUser();
  availablePages: string[] = [
    'Central Overview',
    'Central Performance',
    'Trends',
    'Overview',
    'Dashboard',
    'Performance',
    'Realtime',
    'Diagram',
    'Charts',
    'Events',
    'Reports',
    'Billings',
    'Settings',
    'Billing Admin'
  ];

  // Alarm Management
  editedTags: AlarmTag[] = [];
  expandedIndex: number = -1;
  showAlarmModal: boolean = false;
  newAlarmTag: AlarmTag = this.getEmptyAlarmTag();

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

  tabMode: 'user' | 'alarm' = 'user';

  ngOnInit(): void {
    this.initializeMockData();
  }

  changeTabs(name: 'user' | 'alarm'){
    this.tabMode = name;
  }

  initializeMockData(): void {
    // Mock users
    this.users = ExampleUsers;
    // Mock alarm tags
    this.editedTags = ExampleAlarmTags;
    // Mock notification config
    this.notificationConfig = ExampleNotification;
  }

  // User Management Methods
  getEmptyUser(): User {
    return {
      id: 0,
      username: '',
      password: '',
      role: 'user',
      pageAccess: []
    };
  }

  openAddUserModal(): void {
    this.editingUser = null;
    this.newUser = this.getEmptyUser();
    this.showUserModal = true;
  }

  openEditUserModal(user: User): void {
    this.editingUser = user;
    this.newUser = { ...user, pageAccess: [...user.pageAccess] };
    this.showUserModal = true;
  }

  saveUserChanges(): void {
    console.log('Saving all user changes:', this.users);
    alert('User changes saved successfully!');
  }

  deleteUser(id: number): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.users = this.users.filter(u => u.id !== id);
      alert('User deleted successfully!');
    }
  }

  closeUserModal(): void {
    this.showUserModal = false;
    this.editingUser = null;
    this.newUser = this.getEmptyUser();
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

}
