import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  AddNotificationConfigModel,
  DeleteNotificationConfigModel,
  EmailConfigModel,
  LineConfigModel,
  MsTeamConfigModel,
  NotificationConfigModel,
  NotificationType,
  TelegramConfigModel,
  UpdateNotificationConfigModel,
} from '../../../../../sites/models/event.model';
import { HttpService } from '../../../../../../shared/services/http.service';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { sendMessage } from '../../../../../../store/actions/toaster.actions';
import { ConfirmDialog, ConfirmDialogData } from '../../../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-notification-config',
  standalone: false,
  templateUrl: './notification-config.html',
  styleUrl: './notification-config.scss',
})
export class NotificationConfig implements OnInit {

  notificationTypes = NotificationType;

  // Notification Channel List
  notificationConfig = signal<NotificationConfigModel[]>([]);

  // Modal State
  showModal: boolean = false;
  editingIndex: number = -1;

  // Form model
  newNotiForm: AddNotificationConfigModel = this.getEmptyForm();

  // Per-type config sub-objects (bound to template inputs)
  telegramConfig: TelegramConfigModel = { accessToken: '', userGroup: [] };
  lineConfig: LineConfigModel = { accessToken: '', secret: '', userGroup: [] };
  emailConfig: EmailConfigModel = {
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    fromAddress: '',
    toAddress: [],
    ccAddress: [],
    bccAddress: [],
  };
  msteamConfig: MsTeamConfigModel = { webhookUrl: '' };

  // Temp inputs for tag-chip inputs
  newTelegramChatId: string = '';
  newLineUserId: string = '';
  newToAddress: string = '';
  newCcAddress: string = '';
  newBccAddress: string = '';

  userRole = signal<string>('user');

  pageSizeOptions: number[] = [10, 20, 50, 100];
  pageSize = signal<number>(10);
  currentPage = signal<number>(1);

  tableRowConfig = computed(() => {
    const end = this.currentPage() * this.pageSize();
    const start = end - this.pageSize();
    return this.notificationConfig().slice(start, end);
  });

  totalRows = computed(() => this.notificationConfig().length);
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

  private service = inject(HttpService);
  private store = inject(Store);
  private dialogs = inject(MatDialog);

  ngOnInit(): void {
    const role = localStorage.getItem('role');
    if(role){
      this.userRole.set(role);
    }
    this.getNotificationData();
  }

  async getNotificationData(): Promise<void> {
    const result = await this.service.getNotificationConfig();
    if (result && result.length > 0) {
      this.notificationConfig.set(result);
    } else {
      this.notificationConfig.set([]);
    }
    this.currentPage.set(1);
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

  // ─── Helpers ────────────────────────────────────────────────────────────────

  getEmptyForm(): AddNotificationConfigModel {
    return {
      Enable: false,
      Name: '',
      Type: 'telegram',
      Config: { accessToken: '', userGroup: [] } as TelegramConfigModel,
    };
  }

  getNotiIcon(type: any): string {
    const icons: Record<string, string> = {
      telegram: '✈️',
      line: '💬',
      email: '📧',
      msteam: '👥',
    };
    return icons[type] ?? '🔔';
  }

  onTypeChange(): void {
    // Reset sub-configs when type changes
    this.telegramConfig = { accessToken: '', userGroup: [] };
    this.lineConfig = { accessToken: '', secret: '', userGroup: [] };
    this.emailConfig = {
      host: '',
      port: 587,
      secure: false,
      username: '',
      password: '',
      fromAddress: '',
      toAddress: [],
      ccAddress: [],
      bccAddress: [],
    };
    this.msteamConfig = { webhookUrl: '' };
  }

  // ─── Modal ───────────────────────────────────────────────────────────────────

  openNewNotificationModal(): void {
    this.newNotiForm = this.getEmptyForm();
    this.onTypeChange();
    this.editingIndex = -1;
    this.showModal = true;
  }

  openEditModal(index: number): void {
    const noti = this.notificationConfig()[index];
    this.newNotiForm = {
      Enable: noti.enable,
      Name: noti.name,
      Type: noti.type as any,
      Config: { ...noti.config } as any,
    };
    // Populate per-type sub-objects
    this.onTypeChange();
    const cfg = noti.config as any;
    switch (noti.type as any) {
      case 'telegram':
        this.telegramConfig = { accessToken: cfg.accessToken ?? '', userGroup: [...(cfg.userGroup ?? [])] };
        break;
      case 'line':
        this.lineConfig = { accessToken: cfg.accessToken ?? '', secret: cfg.secret ?? '', userGroup: [...(cfg.userGroup ?? [])] };
        break;
      case 'email':
        this.emailConfig = {
          host: cfg.host ?? '',
          port: cfg.port ?? 587,
          secure: cfg.secure ?? false,
          username: cfg.username ?? '',
          password: cfg.password ?? '',
          fromAddress: cfg.fromAddress ?? '',
          toAddress: [...(cfg.toAddress ?? [])],
          ccAddress: [...(cfg.ccAddress ?? [])],
          bccAddress: [...(cfg.bccAddress ?? [])],
        };
        break;
      case 'msteam':
        this.msteamConfig = { webhookUrl: cfg.webhookUrl ?? '' };
        break;
    }
    this.editingIndex = index;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingIndex = -1;
    this.newNotiForm = this.getEmptyForm();
    this.onTypeChange();
  }

  // ─── Save ────────────────────────────────────────────────────────────────────

  async saveChannel() {
    if (!this.newNotiForm.Name.trim()) {
      this.store.dispatch(sendMessage({ 
        payload: { text: 'Please fill name', type: 'warn' } 
      }));
      return;
    }

    // Build typed config
    let config: any;
    switch (this.newNotiForm.Type as any) {
      case 'telegram': config = { ...this.telegramConfig }; break;
      case 'line':     config = { ...this.lineConfig };     break;
      case 'email':    config = { ...this.emailConfig };    break;
      case 'msteam':   config = { ...this.msteamConfig };   break;
      default:         config = {};
    }
    this.newNotiForm.Config = config;

    if (this.editingIndex >= 0) {
      // Update existing entry in local array
      const updated: NotificationConfigModel = {
        ...this.notificationConfig()[this.editingIndex],
        name: this.newNotiForm.Name,
        type: this.newNotiForm.Type,
        enable: this.newNotiForm.Enable,
        config,
      };
      const updatedArray = [...this.notificationConfig()];
      updatedArray[this.editingIndex] = updated;

      const body: UpdateNotificationConfigModel = {
        Id: updated.id,
        Name: updated.name,
        Enable: updated.enable,
        Type: updated.type,
        Config: updated.config
      };
      const updateResult = await this.service.updateNotificationConfig(body);
      if(updateResult?.StatusCode === 'OK'){
        this.store.dispatch(sendMessage({ 
          payload: { text: updateResult.Message || 'Update notification channel success !', type: 'success' } 
        }));
      } else {
        this.store.dispatch(sendMessage({ 
          payload: { text: updateResult.Message || 'Update notification channel failed !', type: 'error' } 
        }));
      }
      await this.getNotificationData();
    } else {
      // Add new entry to local array (id will be assigned by backend on save)
      const newEntry: NotificationConfigModel = {
        id: `temp_${Date.now()}`,
        name: this.newNotiForm.Name,
        type: this.newNotiForm.Type,
        enable: this.newNotiForm.Enable,
        config,
      };
      const body: AddNotificationConfigModel = {
        Name: newEntry.name,
        Enable: newEntry.enable,
        Type: newEntry.type,
        Config: newEntry.config
      };
      const updateResult = await this.service.addNotificationConfig(body);
      if(updateResult?.StatusCode === 'OK'){
        this.store.dispatch(sendMessage({ 
          payload: { text: updateResult.Message || 'Add notification channel success !', type: 'success' } 
        }));
      } else {
        this.store.dispatch(sendMessage({ 
          payload: { text: updateResult.Message || 'Add notification channel failed !', type: 'error' } 
        }));
      }
      await this.getNotificationData();
    }

    this.closeModal();
  }

  // ─── Delete ──────────────────────────────────────────────────────────────────
  confirmDeleteChannel(id: string): void {
    const dialogData: ConfirmDialogData = {
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item?',
      subMessage: 'This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    };

    const dialogRef = this.dialogs.open(ConfirmDialog, {
      width: '480px',
      data: dialogData,
      panelClass: 'confirm-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === true) {
        await this.deleteChannel(id);
      }
    });

  }
  
  async deleteChannel(id: string) {
    const request: DeleteNotificationConfigModel = {
      Id: id
    };
    const result = await this.service.deleteNotificationConfig(request);
    if(result && result.StatusCode == 'OK'){
      this.sendMessageToState('success', 'Report configuration deleted successfully.');
    } else {
      this.sendMessageToState('error', 'Failed to delete report configuration.');
    }
    await this.getNotificationData();
  }

  // ─── Save All Changes ────────────────────────────────────────────────────────

  // saveChanges(): void {
  //   //console.log('Saving notification config:', this.notificationConfig);
  //   const result = await this.service.updateNotificationConfig
  // }

  // ─── Tag-chip helpers ─────────────────────────────────────────────────────────

  addTelegramId(): void {
    const val = this.newTelegramChatId.trim();
    if (val && !this.telegramConfig.userGroup.includes(val)) {
      this.telegramConfig.userGroup.push(val);
    }
    this.newTelegramChatId = '';
  }
  removeTelegramId(i: number): void { this.telegramConfig.userGroup.splice(i, 1); }

  addLineId(): void {
    const val = this.newLineUserId.trim();
    if (val && !this.lineConfig.userGroup.includes(val)) {
      this.lineConfig.userGroup.push(val);
    }
    this.newLineUserId = '';
  }
  removeLineId(i: number): void { this.lineConfig.userGroup.splice(i, 1); }

  addToAddress(): void {
    const val = this.newToAddress.trim();
    if (val && !this.emailConfig.toAddress.includes(val)) {
      this.emailConfig.toAddress.push(val);
    }
    this.newToAddress = '';
  }
  removeToAddress(i: number): void { this.emailConfig.toAddress.splice(i, 1); }

  addCcAddress(): void {
    const val = this.newCcAddress.trim();
    if (val && !this.emailConfig.ccAddress.includes(val)) {
      this.emailConfig.ccAddress.push(val);
    }
    this.newCcAddress = '';
  }
  removeCcAddress(i: number): void { this.emailConfig.ccAddress.splice(i, 1); }

  addBccAddress(): void {
    const val = this.newBccAddress.trim();
    if (val && !this.emailConfig.bccAddress.includes(val)) {
      this.emailConfig.bccAddress.push(val);
    }
    this.newBccAddress = '';
  }

  removeBccAddress(i: number): void { this.emailConfig.bccAddress.splice(i, 1); }

  sendMessageToState(type:  "error" | "success" | "info" | "warn" | "secondary" | "contrast", msg: string){
    this.store.dispatch(sendMessage({ 
      payload: { type: type, text: msg }
    }));
  }
}