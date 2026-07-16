import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { EventConfigModel, ExpressionParseResultModel, NotificationConfigModel } from '../../../../../sites/models/event.model';
import { AlarmTag } from '../../../../models/billing.model';
import { getZoneConfig } from '../../../../../../store/selectors/site.selectors';
import { PagesService } from '../../../../../../shared/services/pages.service';
import { HttpService } from '../../../../../../shared/services/http.service';
import { SiteModel, SiteStateModel } from '../../../../../../shared/models/config.model';
import { Store } from '@ngrx/store';
import { FloatingDialogService } from '../../../../../../shared/pipes/floating-dialog.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog, ConfirmDialogData } from '../../../../../../shared/components/confirm-dialog/confirm-dialog';
import { sendMessage } from '../../../../../../store/actions/toaster.actions';

@Component({
  selector: 'app-alarm-config',
  standalone: false,
  templateUrl: './alarm-config.html',
  styleUrl: './alarm-config.scss'
})
export class AlarmConfig implements OnInit {

  // Alarm Management
  editedTags = signal<EventConfigModel[]>([]);
  expandedIndex: number = -1;
  showAlarmModal: boolean = false;
  newAlarmTag: EventConfigModel = this.getEmptyAlarmTag();

  // Notification Configuration
  notificationConfig: NotificationConfigModel[] = [];

  // Temp inputs for adding items
  newTelegramChatId: string = '';
  newMsteamWebhook: string = '';
  newEmailAddress: string = '';

  private nextUserId: number = 1;
  private nextAlarmId: number = 1;
  editingIndex: number = -1;

  exPressionResult: ExpressionParseResultModel | null = null;

  tabMode: 'user' | 'notification' | 'alarm' = 'user';

  userRole = signal<string>('user');

  siteList = signal<SiteModel[]>([]);

  pageSizeOptions: number[] = [10, 20, 50, 100];
  pageSize = signal<number>(10);
  currentPage = signal<number>(1); // 1-based

  tableRowConfig = computed(() => {
    const end = this.currentPage() * this.pageSize();
    const start = end - this.pageSize();
    return this.editedTags().slice(start, end);
  })

  totalRows = computed(() => this.editedTags().length);
  totalPages = computed(() => {
    const total = this.totalRows();
    const size = this.pageSize();
    return Math.max(1, Math.ceil(total / Math.max(1, size)));
  });

  pagedRows = computed(() => {
    const rows = this.editedTags();
    const size = Math.max(1, this.pageSize());
    const page = Math.min(Math.max(1, this.currentPage()), this.totalPages());
    const start = (page - 1) * size;
    return rows.slice(start, start + size);
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

  private store = inject(Store);
  private dialog = inject(FloatingDialogService);
  private service = inject(HttpService);
  private pgService = inject(PagesService);
  private dialogs = inject(MatDialog);
  constructor() {
  }

  ngOnInit(): void {
    // this.store.select(getZoneConfig('CENTRAL1')).subscribe(zone => {
    //   if (zone) {
    //     this.siteList.set(zone.siteList);
    //   }
    // });
    const role = localStorage.getItem('role');
    if(role){
      this.userRole.set(role);
    }
    this.getSiteConfig();
    this.getAlarmEventData();
    this.getNotificationData();
  }

  async getSiteConfig(){
    const config: SiteStateModel = await this.service.getConfig2('assets/sitelist.json');
    if(config){
      const zonselected = config.zoneList.map(x => x.siteList).flat(1);
      if(zonselected){
        this.siteList.set(zonselected);
      }
    }
  }

  async getAlarmEventData(){
    const result = await this.service.getAlarmEventConfig();
    if(result && result.length > 0){
      this.editedTags.set(result);
      this.currentPage.set(1);
    } else {
      this.editedTags.set([]);
      this.currentPage.set(1);
    }
  };

  async getNotificationData(){
    const result = await this.service.getNotificationConfig();
    if(result && result.length > 0){
      this.notificationConfig = result;
    } else {
      this.notificationConfig = [];
    }
  };

  // Alarm Management Methods
  getEmptyAlarmTag(): EventConfigModel {
    return {
      ID: -1,
      Message: '',
      Type: 'alarm',
      Level: 'Major',
      Equipment: '',
      Asset: '',
      PointSource: '',
      Location: '',
      LastEventCount: 0,
      lastEventTimestamp: new Date().toISOString(),
      TriggerCounter: 1,
      EnableEmail: false,
      EmailType: '',
      Enable: false,
      Group: 0,
      Order: 0,
      Schedule: '',
      Expression: '',
      Notifications: []
    };
  }


  getSiteNameById(siteId: string | null | undefined): string {
    if (!siteId) return 'N/A';

    const site = this.siteList().find(s => s.id === siteId);
    return site ? site.name : siteId;
  }

  toggleAccordion(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? -1 : index;
  }

  // openNewAlarmModal(): void {
  //   this.newAlarmTag = this.getEmptyAlarmTag();
  //   this.showAlarmModal = true;
  // }

  // closeAlarmModal(): void {
  //   this.showAlarmModal = false;
  //   this.newAlarmTag = this.getEmptyAlarmTag();
  // }

  // saveNewAlarm(): void {
  //   if (!this.newAlarmTag.Message.trim()) {
  //     alert('Please enter alarm name');
  //     return;
  //   }

  //   this.newAlarmTag.ID = this.nextAlarmId++;
  //   this.editedTags.push({ ...this.newAlarmTag });
  //   alert('Alarm added successfully!');
  //   this.closeAlarmModal();
  // }

  isNotiSelected(id: string): boolean {
    return this.newAlarmTag.Notifications.includes(id);
  }

  toggleNoti(id: string): void {
    const idx = this.newAlarmTag.Notifications.indexOf(id);
    if (idx >= 0) {
      this.newAlarmTag.Notifications.splice(idx, 1);
    } else {
      this.newAlarmTag.Notifications.push(id);
    }
  }

  getNotiIcon(type: any): string {
    const icons: Record<string, string> = {
      telegram: '✈️',
      line:     '💬',
      email:    '📧',
      msteam:   '👥',
    };
    return icons[type] ?? '🔔';
  }

  copyTag(index: number): void {
    const tagToCopy = this.editedTags()[index];
    const newTag = { ...tagToCopy, ID: this.nextAlarmId++ };
    this.editedTags.update(tags => [...tags, newTag]);
  }

  deleteTag(index: number): void {
    if (true) {
      this.editedTags.update(tags => tags.filter((_, i) => i !== index));
    }
  }

  async saveAlarmChanges() {
    const result = await this.service.setAlarmEventConfig(this.editedTags());
    if(result && result.StatusCode === 'OK'){
      this.store.dispatch(sendMessage({ payload: { text: 'Alarm configuration saved successfully', type: 'success' } }));
    } else {
      this.store.dispatch(sendMessage({ payload: { text: 'Failed to saved alarm configuration', type: 'success' } }));
    }
  }

  async parseExpressionData(expression: string) {
    //this.exPressionResult = null; // reset previous result
    const result = await this.service.parseExpression(expression);
    this.exPressionResult = result;
  }

  openDialog() {
    this.dialog.open('tag-dialog');
  }

  openNewAlarmModal(): void {
      this.exPressionResult = null; 
    this.newAlarmTag = this.getEmptyAlarmTag();
    this.editingIndex = -1;
    this.showAlarmModal = true;
  }

  openEditModal(index: number): void {
    this.exPressionResult = null; 
    this.newAlarmTag = { ...this.editedTags()[index] };
    this.editingIndex = index;
    this.showAlarmModal = true;
  }

  closeAlarmModal(): void {
    this.exPressionResult = null; 
    this.showAlarmModal = false;
    this.editingIndex = -1;
    this.newAlarmTag = this.getEmptyAlarmTag();
  }

  saveNewAlarm(): void {
    if (!this.newAlarmTag.Message.trim()) {
      alert('Please enter a message');
      return;
    }
    if (this.editingIndex >= 0) {
      // update existing
      this.newAlarmTag.ID = this.editedTags().length > 0 ? Math.max(...this.editedTags().map(t => t.ID)) + 1 : 1;
      this.editedTags.update(tags => {
        const updatedTags = [...tags];
        updatedTags[this.editingIndex] = { ...this.newAlarmTag };
        return updatedTags;
      });
    } else {
      // add new
      this.newAlarmTag.ID = this.editedTags().length > 0 ? Math.max(...this.editedTags().map(t => t.ID)) + 1 : 1;
      this.editedTags.update(tags => [...tags, { ...this.newAlarmTag }]);
    }
    this.closeAlarmModal();
  }

  confirmSaveChanges(): void {
    const dialogData: ConfirmDialogData = {
      title: 'Save Changes Alarm Configuration',
      message: 'Are you sure you want to save this configuration?',
      subMessage: 'This action cannot be undone.',
      confirmText: 'Save',
      cancelText: 'Cancel',
      type: 'info'
    };

    const dialogRef = this.dialogs.open(ConfirmDialog, {
      width: '480px',
      data: dialogData,
      panelClass: 'confirm-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === true) {
        await this.saveAlarmChanges();
      }
    });

  }

  confirmDeleteTag(id: number): void {
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
        this.deleteTag(id);
      }
    });

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

}
