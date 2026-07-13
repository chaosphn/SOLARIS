import { Injectable } from '@angular/core';
import { PageDataModel } from '../models/page.model';

@Injectable({
  providedIn: 'root'
})
export class PagesService {
  private defaultPage = 'main';
  private pageList: PageDataModel[] = [
    {
      level: 'overview',
      page: [ 
        { name: 'Overview', path: 'overview' }, 
        { name: 'Performance', path: 'performance' }, 
        { name: 'Trends', path: 'trend' }, 
        { name: 'Tabular', path: 'tabular' }
      ]
    },
    {
      level: 'operation',
      page: [ 
        { name: 'Overview', path: 'layout' }, 
        { name: 'Dashboard', path: 'dashboard' }, 
        { name: 'Performance', path: 'efficiency' },
        { name: 'Equipment', path: 'realtime' }, 
        { name: 'Topology', path: 'topology' }, 
        { name: 'Diagram', path: 'diagram' }, 
        { name: 'Control', path: 'control' },
        { name: 'Visualization', path: 'charts' },
        { name: 'Alarm & Events', path: 'event' }
      ]
    },
    {
      level: 'financial',
      page: [ 
        { name: 'Contract', path: 'contract' }, 
        { name: 'Revenue', path: 'revenue' }, 
        { name: 'Delivery', path: 'delivery' },
        { name: 'Financial', path: 'financial' }, 
        { name: 'Tariff', path: 'tariff' }, 
        { name: 'SLA / Complaince', path: 'sla' }, 
        { name: 'Delivery Report', path: 'bill-report' }
      ]
    },
    {
      level: 'admin',
      page: [ 
        { name: 'Billings', path: 'billing' }, 
        { name: 'Billing Admin', path: 'admin' }, 
        { name: 'Reports', path: 'reports' }, 
        { name: 'Report Admin', path: 'report-admin' }, 
        { name: 'Settings', path: 'setting' }
      ]
    }
  ];

  getPageList(): any[] {
    return this.pageList;
  };

  getCentralPages(): any[] {
    return this.pageList[0].page;
  };

  getSitePages(): any[] {
    return this.pageList[1].page;
  };

  getFinancialPages(): any[] {
    return this.pageList[2].page;
  };

  getBillingPages(): any[] {
    return this.pageList[3].page;
  };

  isHasPage(path: string): boolean {
    return this.pageList.flatMap(x => x.page).map(x => x.path).includes(path);
  };

  getPageGroup(page: string) {
    return this.pageList.find(x => x.page.map(y => y.path).includes(page));
  }

  isHasPageGroup(pages: string[], group: string): boolean {
    return (
      this.pageList
        .find(x => x.level === group)
        ?.page.some(page => pages.includes(page.path)) ?? false
    );
  }

  
  
}
