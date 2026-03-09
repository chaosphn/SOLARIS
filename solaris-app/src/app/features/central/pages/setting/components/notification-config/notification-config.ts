import { Component, inject, OnInit, signal } from '@angular/core';
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

  private service = inject(HttpService);
  private store = inject(Store);
  private dialogs = inject(MatDialog);

  ngOnInit(): void {
    this.getNotificationData();
  }

  async getNotificationData(): Promise<void> {
    const result = await this.service.getNotificationConfig();
    if (result && result.length > 0) {
      this.notificationConfig.set(result);
    } else {
      this.notificationConfig.set([]);
    }
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

  saveChannel(): void {
    if (!this.newNotiForm.Name.trim()) {
      alert('Please enter a channel name');
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
      this.notificationConfig.set(updatedArray);
    } else {
      // Add new entry to local array (id will be assigned by backend on save)
      const newEntry: NotificationConfigModel = {
        id: `temp_${Date.now()}`,
        name: this.newNotiForm.Name,
        type: this.newNotiForm.Type,
        enable: this.newNotiForm.Enable,
        config,
      };
      this.notificationConfig.update(prev => [...prev, newEntry]);
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
    if (confirm('Are you sure you want to delete this notification channel?')) {
      const request: DeleteNotificationConfigModel = {
        ID: id
      };
      const result = await this.service.deleteNotificationConfig(request);
      if(result && result.StatusCode == 'OK'){
        this.sendMessageToState('success', 'Report configuration deleted successfully.');
      } else {
        this.sendMessageToState('error', 'Failed to delete report configuration.');
      }
    }
  }

  // ─── Save All Changes ────────────────────────────────────────────────────────

  saveChanges(): void {
    //console.log('Saving notification config:', this.notificationConfig);
    alert('Notification changes saved successfully!');
  }

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