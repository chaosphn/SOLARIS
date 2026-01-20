import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PagesService {
  private defaultPage = 'overview';
  private pageList = [
    {
      level: 'central',
      page: [ 
        { name: 'Central Overview', path: 'overview' }, { name: 'Central Performance', path: 'performance' }, { name: 'Central Trends', path: 'trend' }, { name: 'Billings', path: 'billing' }
        ,{ name: 'Central Report', path: 'reports' }, { name: 'Billing Admin', path: 'admin' }, { name: 'Report Admin', path: 'report-admin' }, { name: 'Settings', path: 'setting' }
      ]
    },
    {
      level: 'site',
      page: [ 
        { name: 'Site Overview', path: 'layout' }, { name: 'Dashboard', path: 'dashboard' }, { name: 'Performance', path: 'efficiency' }
        ,{ name: 'Realtime', path: 'realtime' }, { name: 'Diagram', path: 'diagram' }, { name: 'Charts', path: 'charts' }
        ,{ name: 'Events', path: 'event' }, { name: 'Report', path: 'report' }
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

  isHasPage(path: string): boolean {
    return this.pageList.flatMap(x => x.page).map(x => x.path).includes(path);
  };

  
  
}
