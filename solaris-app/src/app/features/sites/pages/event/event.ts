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

@Component({
  selector: 'app-event',
  standalone: false,
  templateUrl: './event.html',
  styleUrl: './event.scss'
})
export class Events implements OnInit, OnDestroy {

  navState$: Observable<NavbarStateModel>;
  config = signal<ReportConfigModel[]>([]);
  mode = signal<'d' | 'w' | 'm' | 'y'>('d');

  siteList = signal<SiteModel[]>([]);
  siteSelected = signal<string>('');
  reportType = signal<string>('');

  navSub?: Subscription;
  pdfurl = signal<string>('');
  date: Date = new Date();
  loading = signal<Boolean>(false);
  loading2 = signal<Boolean>(false);
  
  isDropdownOpen1 = false;
  isDropdownOpen2 = false;
  options: DropdownOption[] = [];
  selectedReport?: DropdownOption;
  selectedSite?: DropdownOption;
  reportOptions = computed(() => {
    const res: DropdownOption[] = this.config().map(x => (
      {
        value: x.type,
        label: x.name,
        icon: 'calendar_today'
      }
    ))
    return res;
  });
  siteOptions = computed(() => {
    const res: DropdownOption[] = this.siteList().map(x => (
      {
        value: x.id,
        label: x.name,
        icon: 'factory'
      }
    ))
    return res;
  })

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
    console.log(this.siteOptions(), this.siteList())
  }

  ngOnDestroy(): void {
    
  }

  async getConfig(){
    try {
      const config = await this.http.getConfig2(`assets/site/reports/configurations/reports.config.json`);
      if(config){
        this.config.set(config);
      } else {
        this.config.set([]);
      }
    } catch (error) {
    }
  }

  toggleDropdown1(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen1 = !this.isDropdownOpen1;
  }

  selectOption1(event: Event, option: DropdownOption): void {
    event.stopPropagation();
    this.selectedReport = option;
    this.isDropdownOpen1 = false;
    switch (option.value) {
      case "daily":
        this.mode.set('d');
        break;
      case "monthly":
        this.mode.set('m');
        break;
      case "yearly":
        this.mode.set('y');
        break;
      default:
        break;
    }
    console.log('Selected:', option.value);
  }

  toggleDropdown2(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen2 = !this.isDropdownOpen2;
  }

  selectOption2(event: Event, option: DropdownOption): void {
    event.stopPropagation();
    this.selectedSite = option;
    this.isDropdownOpen2 = false;
    
    console.log('Selected:', option.value);
  }

  onDateSelect(event: any) {
    this.date = event;
  }

  async selectReport() {
    try {
      this.loading.set(true);
      this.pdfurl.update(prev => '');
      if(this.validateSelection()){
        await new Promise(resolve => setTimeout(resolve, 200));
        const blob: any = await this.http.getReport(this.siteSelected(), this.selectedReport?.value??'', this.date.toISOString());
        if (blob) {
          this.pdfurl.set(URL.createObjectURL(blob));
        } else {
          this.store.dispatch(sendMessage({ 
            payload: { type: 'error', text: 'No Report returned' }
          }));
        }
      };
      this.loading.set(false);
    } catch (error: any) {
      this.store.dispatch(sendMessage({ 
        payload: { type: 'error', text: error.message }
      }));
      this.loading.set(false);
    }
  }
    
  async downloadReport() {
    try {
      this.loading2.set(true);
      if(this.validateSelection()){
        await new Promise(resolve => setTimeout(resolve, 200));
        const blob: any = await this.http.downloadReport(this.siteSelected(), this.selectedReport?.value??'', this.date.toISOString());
      } 
      this.loading2.set(false);
    } catch (error: any) {
      this.store.dispatch(sendMessage({ 
        payload: { type: 'error', text: error.message }
      }));
      this.loading2.set(false);
    }
  }
  
  validateSelection(){
    if(!this.selectedReport?.value){
      this.store.dispatch(sendMessage({ 
        payload: { type: 'error', text: 'Please report type !' }
      }));
      return false;
    }  else {
      return true;
    }
  }

}

interface DropdownOption {
  value: string;
  label: string;
  icon: string;
}
