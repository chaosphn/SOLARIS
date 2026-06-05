import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ReportConfigModel } from '../../models/report.model';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { NavbarStateModel } from '../../../../shared/models/navigate.model';
import { SiteModel } from '../../../../shared/models/config.model';
import { HttpService } from '../../../../shared/services/http.service';
import { Store } from '@ngrx/store';
import { Datetime } from '../../../../shared/services/datetime';
import { getNavState } from '../../../../store/selectors/nav.selectors';
import { getAllConfig, getZoneConfig } from '../../../../store/selectors/site.selectors';
import { sendMessage } from '../../../../store/actions/toaster.actions';
import { ExampleEvents } from '../../../../mockup/event';
import { EventDataModel, EventRequestModel, FilterEventRequestModel } from '../../models/event.model';

@Component({
  selector: 'app-event',
  standalone: false,
  templateUrl: './event.html',
  styleUrl: './event.scss'
})
export class Events implements OnInit, OnDestroy {

  navState$: Observable<NavbarStateModel>;
  config = signal<DropdownItems[]>([]);
  mode = signal<'d' | 'w' | 'm' | 'y'>('d');

  siteList = signal<SiteModel[]>([]);
  siteSelected = signal<string>('');
  reportType = signal<string>('');

  navSub?: Subscription;
  pdfurl = signal<string>('');
  date: Date = new Date();
  loading = signal<Boolean>(false);
  loading2 = signal<Boolean>(false);

  eventList = signal<EventDataModel[]>([]);
  selectedEvent = signal<EventDataModel>({} as EventDataModel);
  selectedOptions: any = {};

  // ─── Table pagination ────────────────────────────────────────────────────────
  pageSizeOptions: number[] = [10, 15, 20, 50, 100];
  pageSize = signal<number>(15);
  currentPage = signal<number>(1); // 1-based

  totalRows = computed(() => this.eventList().length);
  totalPages = computed(() => {
    const total = this.totalRows();
    const size = this.pageSize();
    return Math.max(1, Math.ceil(total / Math.max(1, size)));
  });

  pagedEventList = computed(() => {
    const rows = this.eventList();
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

  private http = inject(HttpService);
  private store = inject(Store);
  private dateTimeSrv = inject(Datetime);

  constructor(){
    this.navState$ = this.store.select(getNavState);
    this.navSub = this.navState$.subscribe(async (state) => {
      //console.log(state.location)
      this.siteSelected.set(state.location);
      const res = await firstValueFrom(
        this.store.select(getAllConfig())
      );
      if(res && res[0]){
        //console.log(res)
        this.siteList.set(res[0].siteList);
      };
    });
  }

  ngOnInit(): void {
    this.getConfig();
    this.getAlarmEventData();
  }

  ngOnDestroy(): void {
    
  }

  async getAlarmEventData(){
    const dt = this.date.setHours(0,0,0,0);
    const st = new Date(dt).toISOString();
    const en = new Date(dt).setDate(this.date.getDate() + 1);
    const request: EventRequestModel = {
      PointSource: this.siteSelected(),
      StartTime: st,
      EndTime: new Date(en).toISOString()
    }

    const result = await this.http.getFilteredAlarmEventData(request);
    if(result){
      this.eventList.set(result.map(x => {
        return {
          ...x,
          Action: 'muted'
        }
      }));
      this.currentPage.set(1);
    } else {
      this.eventList.set([]);
      this.currentPage.set(1);
    }
  }

  async getConfig(){
    try {
      const config = await this.http.getConfig2(`assets/site/events/configurations/event[${this.siteSelected()}].config.json`);
      if(config){
        this.config.set(config);
      } else {
        this.config.set([]);
      }
    } catch (error) {
    }
  }

  toggleDropdown(event: Event, item: DropdownItems) {
    event.stopPropagation();
    item.opened = !item.opened;
    return item;
  }

  selectOption(event: Event, option: DropdownOption, item: DropdownItems) {
    event.stopPropagation();
    item.selectedItem = option;
    item.opened = false;
    if(this.selectedOptions[item.name] && this.selectedOptions[item.name].value === option.value){
      delete this.selectedOptions[item.name];
      item.selectedItem = undefined;
    } else {
      this.selectedOptions[item.name] = option;
    }
    return item;
  }

  async onDateSelect(event: any) {
    this.date = event;
    //await this.getAlarmEventData();
  }

  onRowSelect(data: EventDataModel){
    if(this.selectedEvent() && this.selectedEvent().ID == data.ID){
      this.selectedEvent.set({} as EventDataModel);
    } else {
      this.selectedEvent.set(data);
    }
    this.eventList.update(prev => {
      return prev.map(x => {
        return {
          ...x,
          Action: this.selectedEvent() && this.selectedEvent().ID === x.ID ? 'unmute' : 'muted'
        }
      })
    });
  }

  async onSelectEvent() {
    const dt = this.date.setHours(0,0,0,0);
    const st = new Date(dt).toISOString();
    const en = new Date(dt).setDate(this.date.getDate() + 1);
    //console.log('Selected Event:', this.selectedOptions);
    const request: FilterEventRequestModel = {
      PointSource: this.siteSelected(),
      StartTime: st,
      EndTime: new Date(en).toISOString(),
      Type: this.selectedOptions['Type']?.value || undefined,
      Level: this.selectedOptions['Level']?.value || undefined,
      Assets: this.selectedOptions['Equipment']?.value || undefined,
      Equipments: undefined
    };
    this.selectedEvent.set({} as EventDataModel);
    const result = await this.http.getFilteredAlarmEventData(request);
    if(result){
      this.eventList.set(result.map(x => {
        return {
          ...x,
          Action: 'muted'
        }
      }));
      this.currentPage.set(1);
    } else {
      this.eventList.set([]);
      this.currentPage.set(1);
    }
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

  async exportEventListCsv(): Promise<void> {
    const data = this.eventList();
    if (!data || data.length === 0) {
      return;
    }

    const XLSX = await import('xlsx');

    const events = this.eventList().map((item: EventDataModel, index: number) => {
      return {
        ...item,
        ID: index,
        Condition: this.parseExpression(item.Condition),
        PointSource: this.getSiteName(item.PointSource)
      }
    })

    const stArr = this.date.toLocaleDateString().split('/');
    const findName = `SolarisEvent at ${stArr[1]}${stArr[0]}${stArr[2]}`;

    const worksheet = XLSX.utils.json_to_sheet(events);
    const csv: string = XLSX.utils.sheet_to_csv(worksheet);

    const blob: Blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link: HTMLAnchorElement = document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    link.href = url;
    link.download = findName + '.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  parseExpression(expression: string | undefined){
    if (!expression || typeof expression !== 'string') {
      return '';
    }

    let tagName: string = expression;
    const normalize = (s: any) => s.replace(/\s+/g, '');
    const matches = [...expression.matchAll(/\b(ATTIME|REAL|MAX|MIN|SUM|AVG|LAST|TIMESTAMP)\s*\(([^()]*)\)/g)];
    const uniqueMatches = [
        ...new Map(
            matches.map(m => [normalize(m[0]), m])
        ).values()
    ];
    uniqueMatches.map(x => {
      const expr = x[0];
      const tag = x[2];
      tagName = tagName.replaceAll(expr, tag);
    });
    return tagName;
  }

  getSiteName(id: string){
    return this.siteList().find(x => x.id === id)?.name || id;
  }

}

export interface DropdownItems {
  name: string;
  selectedItem?: DropdownOption;
  opened: boolean;
  item: DropdownOption[];
}

export interface DropdownOption {
  value: string;
  label: string;
  icon: string;
}
