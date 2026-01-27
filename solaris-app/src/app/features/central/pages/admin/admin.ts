import { Component, OnInit } from '@angular/core';
import { BillingConfigModel } from '../../models/billing.model';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
  standalone: false
})
export class Admin implements OnInit {
  // Global settings
  meterMode: 'normal' | 'tou' = 'normal';
  reportMode: 'auto' | 'manual' = 'manual';
  scheduleDayOfMonth: number = 1;
  scheduleTime: string = '10:00';
  approveEmails: string = '';
  globalEmails: string = '';
  energyCost: number = 2.95;
  onpeakCost: number = 4.1839;
  offpeakCost: number = 2.6037;
  discountCost: number = 0;
  ftCost: number = 0.3972;
  co2Ratio: number = 0.23314;
  fuelRatio: number = 3.11;
  treeRatio: number = 0.0193;

  // Modal for add site config
  showModal: boolean = false;
  
  // Site config form
  newSiteConfig: BillingConfigModel = this.getEmptySiteConfig();

  // Site configurations list
  siteConfigs: BillingConfigModel[] = [];
  
  // Table display columns
  displayedColumns: string[] = [
    'siteName', 
    'meterMode', 
    'energyCost', 
    'onpeakCost', 
    'offpeakCost', 
    'discountCost', 
    'ftCost', 
    'emails', 
    'actions'
  ];

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
  }

  changeTabs(name: 'factor' | 'holiday'){
    this.tabMode = name;
  }

  getEmptySiteConfig(): BillingConfigModel {
    return {
      id: 0,
      siteName: '',
      meterMode: 'normal',
      energyCost: 2.95,
      onpeakCost: 4.1839,
      offpeakCost: 2.6037,
      discountCost: 0,
      ftCost: 0.3972,
      co2Ratio: 0.23314,
      fuelRatio: 3.11,
      treeRatio: 0.0193,
      emails: ''
    };
  }

  onMeterModeChange(): void {
    // Reset relevant values when mode changes
    if (this.meterMode === 'normal') {
      this.onpeakCost = 0;
      this.offpeakCost = 0;
    } else {
      this.energyCost = 0;
    }
  }

  saveGlobalSettings(): void {
    console.log('Saving global settings:', {
      meterMode: this.meterMode,
      reportMode: this.reportMode,
      scheduleDayOfMonth: this.scheduleDayOfMonth,
      scheduleTime: this.scheduleTime,
      globalEmails: this.globalEmails,
      energyCost: this.energyCost,
      onpeakCost: this.onpeakCost,
      offpeakCost: this.offpeakCost,
      discountCost: this.discountCost,
      ftCost: this.ftCost,
      co2Ratio: this.co2Ratio,
      fuelRatio: this.fuelRatio,
      treeRatio: this.treeRatio
    });
    // Add your save logic here (e.g., API call)
    alert('Global settings saved successfully!');
  }

  openAddSiteModal(): void {
    this.showModal = true;
    this.newSiteConfig = this.getEmptySiteConfig();
  }

  closeModal(): void {
    this.showModal = false;
    this.newSiteConfig = this.getEmptySiteConfig();
  }

  saveModal(data: BillingConfigModel): void {
    this.showModal = false;
    this.newSiteConfig = this.getEmptySiteConfig();
    this.siteConfigs.push(data);
  }

  deleteSiteConfig(id: number): void {
    if (confirm('Are you sure you want to delete this configuration?')) {
      this.siteConfigs = this.siteConfigs.filter(config => config.id !== id);
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
}
