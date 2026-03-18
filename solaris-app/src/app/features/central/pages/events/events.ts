import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { NavbarStateModel } from '../../../../shared/models/navigate.model';
import { SiteModel } from '../../../../shared/models/config.model';
import { EventDataModel, EventRequestModel, FilterEventRequestModel } from '../../../sites/models/event.model';
import { HttpService } from '../../../../shared/services/http.service';
import { Store } from '@ngrx/store';
import { Datetime } from '../../../../shared/services/datetime';
import { getNavState } from '../../../../store/selectors/nav.selectors';
import { getAllConfig } from '../../../../store/selectors/site.selectors';
import * as XLSX from 'xlsx';


@Component({
  selector: 'app-events',
  standalone: false,
  templateUrl: './events.html',
  styleUrl: './events.scss'
})
export class Events2 implements OnInit, OnDestroy {

  navState$: Observable<NavbarStateModel>;
  config = signal<DropdownItems[]>([]);
  mode = signal<'d' | 'w' | 'm' | 'y'>('d');

  siteList = signal<SiteModel[]>([]);
  siteSelected = signal<string>('');
  reportType = signal<string>('');

  navSub?: Subscription;
  pdfurl = signal<string>('');
  date: Date = new Date();
  start: Date = new Date();
  end: Date = new Date();
  loading = signal<Boolean>(false);
  loading2 = signal<Boolean>(false);

  eventList = signal<EventDataModel[]>([]);
  selectedEvent = signal<EventDataModel>({} as EventDataModel);
  selectedOptions: any = {};

  selectedSite?: DropdownOption;
  isDropdownOpen2 = false;
  siteOptions = computed(() => {
    const res: DropdownOption[] = this.siteList().map(x => (
      {
        value: x.id,
        label: x.name,
        icon: 'factory'
      }
    ))
    return res;
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
    const dt = new Date().setDate(this.date.getDate() + 1);
    this.end = new Date(dt);
    this.getConfig();
    this.getAlarmEventData();
  }

  ngOnDestroy(): void {
    
  }

  async getAlarmEventData(){
    const dt1 = this.start.setHours(0,0,0,0);
    const st = new Date(dt1).toISOString();
    const dt2 = this.end.setHours(0,0,0,0);
    const en = new Date(dt2).toISOString();
    const request: EventRequestModel = {
      StartTime: st,
      EndTime: en
    }

    const result = await this.http.getFilteredAlarmEventData(request);
    if(result){
      this.eventList.set(result.map(x => {
        return {
          ...x,
          Action: 'muted'
        }
      }));
    } else {
      this.eventList.set([]);
    }
  }

  async getConfig(){
    try {
      const config = await this.http.getConfig2(`assets/central/events/configurations/event.config.json`);
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

  toggleDropdown2(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen2 = !this.isDropdownOpen2;
  }

  selectOption2(event: Event, option: DropdownOption): void {
    event.stopPropagation();
    this.isDropdownOpen2 = false;
    if( this.selectedSite && option.value === this.selectedSite.value){
      this.selectedSite = undefined;
    } else {
      this.selectedSite = option;
    }
    
    //console.log('Selected:', option.value);
  }

  async onDateSelect(event: any) {
    this.date = event;
    //await this.getAlarmEventData();
  }

  async onStartDateSelect(event: any) {
    this.start = event;
    //await this.getAlarmEventData();
  }

  async onEndDateSelect(event: any) {
    this.end = event;
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
    const dt1 = this.start.setHours(0,0,0,0);
    const st = new Date(dt1).toISOString();
    const dt2 = this.end.setHours(0,0,0,0);
    const en = new Date(dt2).toISOString();
    //console.log('Selected Event:', this.selectedOptions);
    const request: FilterEventRequestModel = {
      PointSource: this.selectedSite?.value || undefined,
      StartTime: st,
      EndTime: new Date(en).toISOString(),
      Type: this.selectedOptions['Type']?.value || undefined,
      Level: this.selectedOptions['Level']?.value || undefined,
      Equipments: this.selectedOptions['Equipment']?.value || undefined,
      Assets: undefined
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
    } else {
      this.eventList.set([]);
    }
  }

  exportEventListCsv(): void {
    const data = this.eventList();
    if (!data || data.length === 0) {
      return; // nothing to export
    } 

    const events = this.eventList().map((item: EventDataModel, index: number) => {
      return {
        ...item,
        ID: index,
        Condition: this.parseExpression(item.Condition),
        PointSource: this.getSiteName(item.PointSource)
      }
    })

    const stArr = this.start.toLocaleDateString().split('/');
    const enArr = this.end.toLocaleDateString().split('/');
    const findName = `SolarisEvent at ${stArr[1]}${stArr[0]}${stArr[2]} - ${enArr[1]}${enArr[0]}${enArr[2]}`;

    // convert objects array into a worksheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(events);
    const csv: string = XLSX.utils.sheet_to_csv(worksheet);

    // create a blob and trigger download
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
