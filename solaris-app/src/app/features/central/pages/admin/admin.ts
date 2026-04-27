import { Component, inject, OnInit, signal } from '@angular/core';
import { BillingConfigModel, CreateBillingRequestModel, DeleteBillingRequestModel, UpdateBillingRequestModel } from '../../models/billing.model';
import { HttpService } from '../../../../shared/services/http.service';
import { Store } from '@ngrx/store';
import { sendMessage } from '../../../../store/actions/toaster.actions';
import { SiteModel } from '../../../../shared/models/config.model';
import { firstValueFrom } from 'rxjs';
import { getAllConfig } from '../../../../store/selectors/site.selectors';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { UserDataModel } from '../../../../shared/models/user.model';
import { HolidayRequestModel } from '../../../../shared/models/holiday.model';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
  standalone: false
})
export class Admin implements OnInit {

  showModal: boolean = false;
  globalConfig = signal<BillingConfigModel>({} as BillingConfigModel);
  siteConfigs = signal<BillingConfigModel[]>([]);
  newSiteConfig: BillingConfigModel = this.getEmptySiteConfig();
  displayedColumns: string[] = [
    'siteId', 
    'meterType', 
    'energyCost', 
    'onpeakCost', 
    'offpeakCost', 
    'discountCost', 
    'ftCost', 
    'emails', 
    'actions'
  ];
  siteList = signal<SiteModel[]>([]);
  userList = signal<UserDataModel[]>([]);
  private nextId: number = 1;

  // Holiday Settings
  selectedYear: Date = new Date();
  selectedHolidayDate: Date = new Date();
  holidayStartDate: Date | null = null;
  holidayEndDate: Date | null = null;
  holidayArr = signal<Date[]>([]);
  removable: boolean = true;

  userRole = signal<string>('user');
  mode = signal<'view' | 'edit' | 'add'>('view');

  tabMode: 'factor' | 'holiday' = 'factor';

  monthArr = [
    { no: 1, name: 'January' },
    { no: 2, name: 'February' },
    { no: 3, name: 'March' },
    { no: 4, name: 'April' },
    { no: 5, name: 'May' },
    { no: 6, name: 'June' },
    { no: 7, name: 'July' },
    { no: 8, name: 'August' },
    { no: 9, name: 'September' },
    { no: 10, name: 'October' },
    { no: 11, name: 'November' },
    { no: 12, name: 'December' }
  ];

  private httpSrv = inject(HttpService);
  private store = inject(Store);
  private dialogs = inject(MatDialog);

  ngOnInit(): void {
    const role = localStorage.getItem('role');
    if(role){
      this.userRole.set(role);
    }
    this.initializeUserData();
    this.getBillingConfigData();
    this.getSiteListData();
    this.getHolidaysFromBackend();
  }

  private getDateKey(date: Date): string {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private toLocalStartOfDay(date: Date): Date {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  async getHolidaysFromBackend(): Promise<void> {
    try {
      const year = this.selectedYear?.getFullYear?.() ?? new Date().getFullYear();
      const request: HolidayRequestModel = {
        StartDate: `${year}-01-01`,
        EndDate: `${year}-12-31`
      };
      const result = await this.httpSrv.getReportHoliday(request);
      if (result && result.length > 0) {
        const uniqueByDate = new Map<string, Date>();
        for (const holiday of result as any[]) {
          const localDate = this.toLocalStartOfDay(new Date(holiday.StartDate));
          uniqueByDate.set(this.getDateKey(localDate), localDate);
        }
        const dates = Array.from(uniqueByDate.values()).sort((a, b) => a.getTime() - b.getTime());
        this.holidayArr.set(dates);
      } else {
        this.holidayArr.set([]);
      }
    } catch (error) {
      console.error('Failed to fetch holidays:', error);
      this.sendMessageToState('error', 'Failed to load holidays from server');
    }
  }

  async getBillingConfigData(){
    const result = await this.httpSrv.getBillingConfig();
    if(result && result.status === 'success'){
      const global = result.data.find(x => x.siteId === 'global');
      if(global){
        this.globalConfig.set(global);
      }
      const sites = result.data.filter(x => x.siteId !== 'global');
      if(sites){
        this.siteConfigs.set(sites);
      }
    }
  }

  async initializeUserData() {
    const result = await this.httpSrv.getUserConfig();
    if (result) {
      this.userList.set(result);
    } else {
      this.userList.set([]);
    }
  }

  async getSiteListData(){
    const res = await firstValueFrom(
      this.store.select(getAllConfig())
    );
    if(res && res[0]){
      ////console.log(res)
      this.siteList.set(res[0].siteList);
    };
  }

  changeTabs(name: 'factor' | 'holiday'){
    this.tabMode = name;
  }

  getEmptySiteConfig(): BillingConfigModel {
    return {
      id: 0,
      siteId: '',
      meterType: 'normal',
      billingMode: 'manual',
      energyCost: 0,
      onpeakCost: 0,
      offpeakCost: 0,
      discountRate: 0,
      ftRate: 0,
      scheduleDate: '1',
      scheduleTime: '',
      confirmation_user: [],
      confirmation_account: [],
      confirmation_customer: [],
      invoice_user: [],
      invoice_account: [],
      invoice_customer: [],
      receipt_user: [],
      receipt_account: [],
      receipt_customer: []
    };
  }

  onMeterModeChange(): void {
    // Reset relevant values when mode changes
    if (this.globalConfig().meterType === 'normal') {
      this.globalConfig.update(val => {
        return {
          ...val,
          onpeakCost: 0,
          offpeakCost: 0
        }
      });
    } else {
      this.globalConfig.update(val => {
        return {
          ...val,
          energyCost: 0
        }
      })
    }
  }

  async saveGlobalSettings() {
  
    if (this.globalConfig().meterType === 'normal' && !this.globalConfig().energyCost) {
      return this.sendMessageToState('warn', 'Please enter the energy cost.');
    }
  
    if (this.globalConfig().meterType === 'tou' && !this.globalConfig().onpeakCost) {
      return this.sendMessageToState('warn', 'Please enter the on-peak energy cost.');
    }
  
    if (this.globalConfig().meterType === 'tou' && !this.globalConfig().offpeakCost) {
      return this.sendMessageToState('warn', 'Please enter the off-peak energy cost.');
    }
  
    if (this.globalConfig().billingMode === 'auto' && !this.globalConfig().scheduleDate) {
      return this.sendMessageToState('warn', 'Please select a billing schedule date.');
    }
  
    if (this.globalConfig().billingMode === 'auto' && !this.globalConfig().scheduleTime) {
      return this.sendMessageToState('warn', 'Please select a billing schedule time.');
    }
  
    if (this.globalConfig().id > 0) {
      const request: UpdateBillingRequestModel = this.globalConfig();
      const result = await this.httpSrv.updateBillingConfig(request);
  
      if (result?.StatusCode?.toLowerCase().includes('success')) {
        this.sendMessageToState('success', 'Billing configuration updated successfully.');
      } else {
        this.sendMessageToState('error', 'Failed to update billing configuration.');
      }
    } else {
  
      const request: CreateBillingRequestModel = {
        siteId: 'global',
        meterType: this.globalConfig().meterType,
        billingMode: this.globalConfig().billingMode,
        energyCost: this.globalConfig().energyCost,
        onpeakCost: this.globalConfig().onpeakCost,
        offpeakCost: this.globalConfig().offpeakCost,
        discountRate: this.globalConfig().discountRate,
        ftRate: this.globalConfig().ftRate,
        scheduleDate: this.globalConfig().scheduleDate,
        scheduleTime: this.globalConfig().scheduleTime,
        confirmation_user: this.globalConfig().confirmation_user,
        confirmation_account: this.globalConfig().confirmation_account,
        confirmation_customer: this.globalConfig().confirmation_customer,
        invoice_user: this.globalConfig().invoice_user,
        invoice_account: this.globalConfig().invoice_account,
        invoice_customer: this.globalConfig().invoice_customer,
        receipt_user: this.globalConfig().receipt_user,
        receipt_account: this.globalConfig().receipt_account,
        receipt_customer: this.globalConfig().receipt_customer
      };
  
      const result = await this.httpSrv.addBillingConfig(request);
  
      if (result?.StatusCode?.toLowerCase().includes('success')) {
        this.sendMessageToState('success', 'Billing configuration created successfully.');
      } else {
        this.sendMessageToState('error', 'Failed to create billing configuration.');
      }
    }
  
    await this.getBillingConfigData();
  }
  

  openAddSiteModal(): void {
    this.mode.set('add');
    this.showModal = true;
    this.newSiteConfig = this.getEmptySiteConfig();
  }

  async closeModal() {
    this.mode.set('view');
    this.showModal = false;
    this.newSiteConfig = this.getEmptySiteConfig();
    await this.getBillingConfigData();
  }

  async saveModal(data: BillingConfigModel): Promise<void> {
    this.mode.set('view');
    this.showModal = false;
    this.newSiteConfig = this.getEmptySiteConfig();
    await this.getBillingConfigData();
  }

  confirmDeleteSiteConfig(id: number): void {
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
        await this.deleteSiteConfig(id);
      }
    });

  }

  async deleteSiteConfig(id: number) {
    if (true) {
      const request: DeleteBillingRequestModel  =  { id: id };
      const result = await this.httpSrv.deleteBillingConfig(request);
      if(result && result.StatusCode && result.StatusCode.toLowerCase().includes('success')){
        this.sendMessageToState('success', 'Billing configuration deleted successfully.');
      } else {
        this.sendMessageToState('error', 'Failed to delete billing configuration.');
      }
      await this.getBillingConfigData();
    }
  }

  viewSiteConfig(config: BillingConfigModel): void {
    this.mode.set('view');
    this.newSiteConfig = { ...config };
    this.showModal = true;
  }

  editSiteConfig(config: BillingConfigModel): void {
    this.mode.set('edit');
    this.newSiteConfig = { ...config };
    this.showModal = true;
  }

  // Holiday Methods
  selectHolidayDate(date: Date): void {
    this.selectedHolidayDate = date;
    const selected = this.toLocalStartOfDay(date);
    const selectedKey = this.getDateKey(selected);
    this.holidayArr.update(arr => {
      const dateExists = arr.some(d => this.getDateKey(d) === selectedKey);
      if (!dateExists) {
        const newArr: Date[] = [...arr, selected];
        newArr.sort((a, b) => a.getTime() - b.getTime());
        return newArr;
      } else {        return arr;
      } 
    });
  }

  onHolidayStartDateChange(date: Date): void {
    this.holidayStartDate = date;
  }

  onHolidayEndDateChange(date: Date): void {
    this.holidayEndDate = date;
  }

  async setHolidays(): Promise<void> {
    try {
      if (this.holidayArr().length === 0) {
        this.sendMessageToState('warn', 'Please select date!');
        return;
      }
      // Save to backend
      const res = await this.saveHolidaysToBackend();
      if(res){
        await this.getHolidaysFromBackend();
      } else {
        this.sendMessageToState('error', 'Failed to save holidays to server');
        return;
      }
      this.sendMessageToState('success', 'Holiday added successfully!');
      this.selectedHolidayDate = new Date();
    } catch (error) {
      console.error('Failed to save holidays:', error);
      this.sendMessageToState('error', 'Failed to save holidays');
    }
  }

  async saveHolidaysToBackend(): Promise<any> {
    const year = this.selectedYear?.getFullYear?.() ?? new Date().getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    const payload = {
      start: this.getDateKey(startOfYear),
      end: this.getDateKey(endOfYear),
      holidays: this.holidayArr().map(d => {
        const start = this.toLocalStartOfDay(d);
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
        return ({
        Name: "Custom Holiday",
        Type: 'custom',
        StartDate: start.toISOString(),
        EndDate: end.toISOString()
        });
      })
    };

    const result = await this.httpSrv.setReportHoliday(payload);
    if (result) return result;
    throw new Error('Failed to save holidays to backend');
  }

  filterDateByMonth(monthNo: number, dates: Date[]): Date[] {
    return dates.filter(date => date.getMonth() + 1 === monthNo);
  }

  async removeHoliday(date: Date): Promise<void> {
    try {
      this.holidayArr.update(arr => arr.filter(d => d.toDateString() !== date.toDateString()));
      
      // Save updated list to backend
      // await this.saveHolidaysToBackend();
      // this.sendMessageToState('success', 'Holiday removed successfully!');
    } catch (error) {
      console.error('Failed to remove holiday:', error);
      this.sendMessageToState('error', 'Failed to remove holiday');
    }
  }

  getDaySuffix(day: number): string {
    if (day >= 11 && day <= 13) {
      return 'th';
    }
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  sendMessageToState(type:  "error" | "success" | "info" | "warn" | "secondary" | "contrast", msg: string){
    this.store.dispatch(sendMessage({ 
      payload: { type: type, text: msg }
    }));
  }

  validateEmailList(value: string | null | undefined): boolean {

    if (!value) return false;

    // split email ด้วย comma
    const emails = value
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    if (emails.length === 0) return false;

    // basic email regex (safe สำหรับ frontend validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emails.every(email => emailRegex.test(email));
  }

  getSiteName(id: string){
    return this.siteList().find(x => x.id === id)?.name || id;
  }

}
