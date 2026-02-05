import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { NavbarStateModel } from '../../../../shared/models/navigate.model';
import { SiteModel } from '../../../../shared/models/config.model';
import { HttpService } from '../../../../shared/services/http.service';
import { Store } from '@ngrx/store';
import { Datetime } from '../../../../shared/services/datetime';
import { getNavState } from '../../../../store/selectors/nav.selectors';
import { getAllConfig, getZoneConfig } from '../../../../store/selectors/site.selectors';
import { ReportConfigModel } from '../../../sites/models/report.model';
import { sendMessage } from '../../../../store/actions/toaster.actions';
import { Router } from '@angular/router';
import { BillingSessionModel } from '../../../../shared/models/billing.model';

@Component({
  selector: 'app-billing',
  standalone: false,
  templateUrl: './billing.html',
  styleUrl: './billing.scss'
})
export class Billing implements OnInit, OnDestroy {

  navState$: Observable<NavbarStateModel>;
  config = signal<ReportConfigModel[]>([]);
  mode = signal<'d' | 'w' | 'm' | 'y'>('m');

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
  });

  sessionId = signal<string>('');
  sessionData = signal<BillingSessionModel | null>(null);

  private http = inject(HttpService);
  private store = inject(Store);
  private dateTimeSrv = inject(Datetime);
  private router = inject(Router);

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
    console.log(this.router.url);
    const urlParts = this.router.url.split('/');
    const sessionId = urlParts[urlParts.length - 1];
    this.sessionId.set(sessionId);
    if(sessionId !== 'viewer'){
      this.getSessionData();
    }
    console.log(this.siteOptions(), this.siteList())
  }

  ngOnDestroy(): void {
    
  }

  async getConfig(){
    try {
      const config = await this.http.getConfig2(`assets/central/reports/configurations/reports.config.json`);
      if(config){
        this.config.set(config);
      } else {
        this.config.set([]);
      }
    } catch (error) {
    }
  }

  async getSessionData(){
    try {
      const data: BillingSessionModel = await this.http.getBillingSessionData(this.sessionId());
      if(data && data.site){
        this.sessionData.set(data);
        this.date = new Date(data.timestamp);
        const findSite = this.siteOptions().find(x => x.value === data.site);
        if(findSite){
          this.selectedSite = findSite;
        }
      } else {
        this.sessionData.set(null);
      }
    } catch (error) {
      this.sessionData.set(null);
    } 
  };

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
      if(this.selectedSite?.value){
        await new Promise(resolve => setTimeout(resolve, 200));
        const blob: any = await this.http.getBilling(this.selectedSite?.value, this.date.toISOString(), this.selectedReport?.value);
        if(blob && blob.session){
          this.sessionId.set(blob.session);
        }
        if (blob && blob.data) {
          // const bb = new Blob()
          // this.pdfurl.set(URL.createObjectURL(blob.data));
          const byteArray = new Uint8Array(blob.data.data);
          const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });
          this.pdfurl.set(URL.createObjectURL(pdfBlob));
        } else {
          this.store.dispatch(sendMessage({ 
            payload: { type: 'error', text: 'No billings returned' }
          }));
        }
      } else {
        this.store.dispatch(sendMessage({ 
          payload: { type: 'error', text: 'Please select site !' }
        }));
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
      if(this.selectedSite?.value){
        await new Promise(resolve => setTimeout(resolve, 200));
        const blob: any = await this.http.downloadBilling(this.selectedSite?.value, this.date.toISOString(), this.selectedReport?.value);
      } else {
        this.store.dispatch(sendMessage({ 
          payload: { type: 'error', text: 'Please select site !' }
        }));
      };
      this.loading2.set(false);
    } catch (error: any) {
      this.store.dispatch(sendMessage({ 
        payload: { type: 'error', text: error.message }
      }));
      this.loading2.set(false);
    }
  }

  async approveBillingData() {
    try {
      if(!this.siteSelected && !this.selectedSite?.value){
        this.store.dispatch(sendMessage({ 
          payload: { type: 'error', text: 'Please select site !' }
        }));
      }

      if(!this.sessionData){
        this.store.dispatch(sendMessage({ 
          payload: { type: 'error', text: 'No data for this bill !' }
        }));
      }
      const ts = this.date.toISOString();
      const sietId = this.selectedSite?.value || '';
      const result = await this.http.approveBilling(this.sessionId(), ts, sietId);
      if(result && result?.StatusCode === "Approve Billing Success"){
        this.store.dispatch(sendMessage({ 
          payload: { type: 'info', text: result?.Message }
        }));
      } else {
        this.store.dispatch(sendMessage({ 
          payload: { type: 'error', text: result?.Message || 'Billing approval failed !' }
        }));
      }

    } catch (error: any) {
      this.store.dispatch(sendMessage({ 
        payload: { type: 'error', text: error.message }
      }));
    }
  };

}

interface DropdownOption {
  value: string;
  label: string;
  icon: string;
}