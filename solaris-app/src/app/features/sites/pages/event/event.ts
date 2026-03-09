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

  private http = inject(HttpService);
  private store = inject(Store);
  private dateTimeSrv = inject(Datetime);

  constructor(){
    this.navState$ = this.store.select(getNavState);
    this.navSub = this.navState$.subscribe(async (state) => {
      console.log(state.location)
      this.siteSelected.set(state.location);
      const res = await firstValueFrom(
        this.store.select(getAllConfig())
      );
      if(res && res[0]){
        console.log(res)
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
    } else {
      this.eventList.set([]);
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
    console.log('Selected Event:', this.selectedOptions);
    const request: FilterEventRequestModel = {
      PointSource: this.siteSelected(),
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
