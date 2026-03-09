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
  private nextId: number = 1;

  // Holiday Settings
  selectedHolidayDate: Date | null = null;
  holidayStartDate: Date | null = null;
  holidayEndDate: Date | null = null;
  holidayArr: Date[] = [];
  removable: boolean = true;

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
    // Initialize with mock holiday data
    this.holidayArr = [
      new Date(2025, 0, 1),  // Jan 1 - New Year
      new Date(2025, 1, 14), // Feb 14 - Valentine's Day
      new Date(2025, 3, 6),  // Apr 6 - Chakri Day
      new Date(2025, 3, 13), // Apr 13 - Songkran
      new Date(2025, 3, 14), // Apr 14 - Songkran
      new Date(2025, 3, 15), // Apr 15 - Songkran
      new Date(2025, 4, 1),  // May 1 - Labour Day
      new Date(2025, 4, 5),  // May 5 - Coronation Day
      new Date(2025, 6, 28), // Jul 28 - King's Birthday
      new Date(2025, 7, 12), // Aug 12 - Queen's Birthday
      new Date(2025, 9, 13), // Oct 13 - King Bhumibol Day
      new Date(2025, 9, 23), // Oct 23 - Chulalongkorn Day
      new Date(2025, 11, 5), // Dec 5 - King Bhumibol Birthday
      new Date(2025, 11, 10), // Dec 10 - Constitution Day
      new Date(2025, 11, 31)  // Dec 31 - New Year's Eve
    ];
    this.getBillingConfigData();
    this.getSiteListData();
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
      approvedBy: '',
      approvedCc: '',
      approvedBcc: '',
      receivedBy: '',
      receivedCc: '',
      receivedBcc: ''
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

    if (!this.globalConfig().approvedBy) {
      return this.sendMessageToState('warn', 'Please select an approver.');
    }
  
    if (!this.globalConfig().receivedBy) {
      return this.sendMessageToState('warn', 'Please select a receiver.');
    }

    if (!this.validateEmailList(this.globalConfig().approvedBy)) {
      return this.sendMessageToState('warn', 'Please enter a valid approver email address.');
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
        approvedBy: this.globalConfig().approvedBy,
        approvedCc: this.globalConfig().approvedCc,
        approvedBcc: this.globalConfig().approvedBcc,
        receivedBy: this.globalConfig().receivedBy,
        receivedCc: this.globalConfig().receivedCc,
        receivedBcc: this.globalConfig().receivedBcc
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
    this.showModal = true;
    this.newSiteConfig = this.getEmptySiteConfig();
  }

  async closeModal() {
    this.showModal = false;
    this.newSiteConfig = this.getEmptySiteConfig();
    await this.getBillingConfigData();
  }

  saveModal(data: BillingConfigModel): void {
    this.showModal = false;
    this.newSiteConfig = this.getEmptySiteConfig();
    //this.siteConfigs.push(data);
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

  editSiteConfig(config: BillingConfigModel): void {
    this.newSiteConfig = { ...config };
    this.showModal = true;
  }

  // Holiday Methods
  selectHolidayDate(date: Date): void {
    this.selectedHolidayDate = date;
    this.setHolidays();
  }

  onHolidayStartDateChange(date: Date): void {
    this.holidayStartDate = date;
  }

  onHolidayEndDateChange(date: Date): void {
    this.holidayEndDate = date;
  }

  setHolidays(): void {
    if (this.holidayStartDate && this.holidayEndDate) {
      // Add range of dates
      const start = new Date(this.holidayStartDate);
      const end = new Date(this.holidayEndDate);
      
      if (start > end) {
        alert('Start date must be before end date');
        return;
      }

      const currentDate = new Date(start);
      while (currentDate <= end) {
        const dateExists = this.holidayArr.some(
          d => d.toDateString() === currentDate.toDateString()
        );
        
        if (!dateExists) {
          this.holidayArr.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      this.holidayArr.sort((a, b) => a.getTime() - b.getTime());
      alert('Holidays added successfully!');
      
    } else if (this.selectedHolidayDate != null) {
      // Add single date
      const stDate = this.selectedHolidayDate;
      const dateExists = this.selectedHolidayDate != null && this.holidayArr.some(
        d => d.toISOString() === new Date(stDate).toISOString()
      );
      
      if (!dateExists) {
        this.holidayArr.push(new Date(this.selectedHolidayDate));
        this.holidayArr.sort((a, b) => a.getTime() - b.getTime());
        alert('Holiday added successfully!');
      } else {
        alert('This date is already in the holiday list');
      }
    } else {
      alert('Please select a date or date range');
    }
  }

  filterDateByMonth(monthNo: number, dates: Date[]): Date[] {
    return dates.filter(date => date.getMonth() + 1 === monthNo);
  }

  removeHoliday(date: Date): void {
    this.holidayArr = this.holidayArr.filter(
      d => d.toDateString() !== date.toDateString()
    );
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
