import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-report-admin',
  standalone: false,
  templateUrl: './report-admin.html',
  styleUrl: './report-admin.scss'
})
export class ReportAdmin implements OnInit {
  reportMode: 'auto' | 'manual' = 'manual';
  scheduleDayOfMonth: number = 1;
  scheduleTime: string = '10:00';
  globalEmails: string = '';

  // Modal for add site config
  showModal: boolean = false;
  
  // Site config form
  newSiteConfig: SiteConfig = this.getEmptySiteConfig();
  
  // Available sites (mock data)
  availableSites: string[] = [
    'Site 01 - Solar Rooftop Singha Kameda',
    'Site 02 - Solar Rooftop Vara Food Phase1',
    'Site 03 - Solar Rooftop PSC Starch',
    'Site 04 - Solar Rooftop Singha Park Chiangrai',
    'Site 05 - Solar Rooftop Vara Food Phase2',
    'Site 06 - Solar Rooftop SRB',
    'Site 07 - Solar Rooftop WNB2',
    'Site 08 - Solar Rooftop KKB Factory',
    'Site 09 - Solar Rooftop BAB',
    'Site 10 - Solar Rooftop SBC'
  ];

  // Site configurations list
  siteConfigs: SiteConfig[] = [];

  private nextId: number = 1;

  // Holiday Settings
  selectedHolidayDate: Date | null = null;
  holidayStartDate: Date | null = null;
  holidayEndDate: Date | null = null;
  holidayArr: Date[] = [];
  removable: boolean = true;

  tabMode: 'report' | 'holiday' = 'report';

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
    console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
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

  changeTabs(name: 'report' | 'holiday'): void {
    this.tabMode = name;
  }

  getEmptySiteConfig(): SiteConfig {
    return {
      id: 0,
      siteName: '',
      emails: ''
    };
  }

  onReportModeChange(): void {
    console.log('Report mode changed to:', this.reportMode);
  }

  saveGlobalSettings(): void {
    console.log('Saving global settings:', {
      reportMode: this.reportMode,
      scheduleDayOfMonth: this.scheduleDayOfMonth,
      scheduleTime: this.scheduleTime,
      globalEmails: this.globalEmails
    });
    // Add your save logic here (e.g., API call)
    alert('Report settings saved successfully!');
  }

  openAddSiteModal(): void {
    this.showModal = true;
    this.newSiteConfig = this.getEmptySiteConfig();
  }

  closeModal(): void {
    this.showModal = false;
    this.newSiteConfig = this.getEmptySiteConfig();
  }

  saveSiteConfig(): void {
    if (!this.newSiteConfig.siteName) {
      alert('Please select a site');
      return;
    }

    if (this.siteConfigs.findIndex((x: SiteConfig) => x.id == this.newSiteConfig.id) >= 0) {
      this.siteConfigs = this.siteConfigs.map((x: SiteConfig) => {
        if (x.id == this.newSiteConfig.id) {
          x = { ...this.newSiteConfig };
        }
        return x;
      });
    } else {
      this.newSiteConfig.id = this.nextId++;
      this.siteConfigs.push({ ...this.newSiteConfig });
    }
    
    console.log('Site config saved:', this.newSiteConfig);
    alert('Site email configuration saved successfully!');
    
    this.closeModal();
  }

  deleteSiteConfig(id: number): void {
    if (confirm('Are you sure you want to delete this configuration?')) {
      this.siteConfigs = this.siteConfigs.filter(config => config.id !== id);
    }
  }

  editSiteConfig(config: SiteConfig): void {
    this.newSiteConfig = { ...config };
    this.showModal = true;
  }

  selectHolidayDate(date: Date): void {
    this.selectedHolidayDate = date;
    this.setHolidays();
  }

  setHolidays(): void {
    if (this.holidayStartDate && this.holidayEndDate) {
      this.addHolidayRange();
    } else if (this.selectedHolidayDate) {
      this.addSingleHoliday();
    } else {
      alert('Please select a date or date range');
    }
  }

  private addHolidayRange(): void {
    const start = new Date(this.holidayStartDate!);
    const end = new Date(this.holidayEndDate!);
    
    if (start > end) {
      alert('Start date must be before end date');
      return;
    }

    const currentDate = new Date(start);
    while (currentDate <= end) {
      if (!this.isHolidayExists(currentDate)) {
        this.holidayArr.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    this.holidayArr.sort((a, b) => a.getTime() - b.getTime());
    alert('Holidays added successfully!');
  }

  private addSingleHoliday(): void {
    const date = new Date(this.selectedHolidayDate!);
    
    if (this.isHolidayExists(date)) {
      alert('This date is already in the holiday list');
      return;
    }

    this.holidayArr.push(date);
    this.holidayArr.sort((a, b) => a.getTime() - b.getTime());
    alert('Holiday added successfully!');
  }

  private isHolidayExists(date: Date): boolean {
    return this.holidayArr.some(d => d.toDateString() === date.toDateString());
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

export interface SiteConfig {
  id: number;
  siteName: string;
  emails: string;
};
