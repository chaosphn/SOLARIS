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

  eventList = signal<any[]>(ExampleEvents);
  selectedEvent = signal<any>(null);

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
  }

  ngOnDestroy(): void {
    
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
    return item;
  }

  onDateSelect(event: any) {
    this.date = event;
  }

  onRowSelect(data: any){
    if(this.selectedEvent() && this.selectedEvent().timestamp == data.timestamp){
      this.selectedEvent.set(null);
    } else {
      this.selectedEvent.set(data);
    }
    this.eventList.update(prev => {
      return prev.map(x => {
        return {
          ...x,
          action: this.selectedEvent() && this.selectedEvent().timestamp === x.timestamp ? 'unmute' : 'muted'
        }
      })
    });
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
