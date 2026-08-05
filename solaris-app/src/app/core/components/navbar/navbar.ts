import { Component, inject, OnInit, OnDestroy, signal, AfterViewInit } from '@angular/core';
import { SiteModel, SiteStateModel, ZoneModel } from '../../../shared/models/config.model';
import { DateStateModel, NavbarStateModel } from '../../../shared/models/navigate.model';
import { filter, Observable, Subscription, timer } from 'rxjs';
import { AuthService } from '../../../shared/services/auth.service';
import { HttpService } from '../../../shared/services/http.service';
import { NavigationEnd, Router } from '@angular/router';
import { AppInitService } from '../../../shared/services/app-init.service';
import { Store } from '@ngrx/store';
import { AppStateModule } from '../../../store/app.state';
import { getNavState, getLastLocation } from '../../../store/selectors/nav.selectors';
import { addState } from '../../../store/actions/nav.actions';
import { setSite } from '../../../store/actions/site.actions';
import { ThemeService } from '../../../shared/services/theme.service';
import { getDateState } from '../../../store/selectors/date.selectors';
import { setDate, setDateEnable } from '../../../store/actions/date.actions';
import { resetLayoutState } from '../../../features/sites/store/actions/layout.action';
import { resetDashboardState } from '../../../features/sites/store/actions/dashboard.action';
import { resetEfficiencyState } from '../../../features/sites/store/actions/performance.action';
import { resetDiagramState } from '../../../features/sites/store/actions/diagram.action';
import { resetTags } from '../../../store/actions/tags.actions';
import { MessageService } from 'primeng/api';
import { ToastStateModel } from '../../../shared/models/toast.model';
import { getToastState } from '../../../store/selectors/toaster.selectors';
import { FloatingDialogService } from '../../../shared/pipes/floating-dialog.service';
import { EventSummaryModel } from '../../../features/sites/models/event.model';
import { setEventSummary } from '../../../store/actions/event.actions';
import { getEventSummary } from '../../../store/selectors/event.selectors';
import { PagesService } from '../../../shared/services/pages.service';
import { mapPlantsToSiteState } from '../../../shared/utils/plant-mapper';
import { getLastUpdateState } from '../../../store/selectors/last-update.selectors';
import { clearLastUpdate } from '../../../store/actions/last-update.actions';
import { Datetime } from '../../../shared/services/datetime';


@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  standalone: false
})
export class Navbar implements OnInit, OnDestroy, AfterViewInit {
  navState$: Observable<NavbarStateModel>;
  dateState$: Observable<DateStateModel>;
  toastState$: Observable<ToastStateModel>;
  eventSummary$: Observable<EventSummaryModel[]>;

  siteConfig = signal<SiteStateModel>({ name: '', number: 0, capacity: '', zoneList: [] });
  zoneList = signal<ZoneModel>({ title: '', number: 0, capacity: '', display: '', siteList: [] });
  currentNavState = signal<NavbarStateModel>({ name: '', location: '' });
  eventSummary = signal<EventSummaryModel[]>([]);
  isHided: boolean = false;
  seachText: string = '';
  zoneSelected: string = 'OVERVIEW';
  user: string | undefined = '';
  role: string | undefined = '';
  sub1?: Subscription;
  lastUpdateSubscription?: Subscription;
  routerSubscription?: Subscription;
  dateStateSubscription?: Subscription;
  navStateSubscription?: Subscription;
  toastStateSubscription?: Subscription;
  timerSubscription?: Subscription;
  siteName: string = "";
  timers: number = 10;
  mode = signal<'dark' | 'light'>('light');
  logoUrl = signal<string>('assets/images/logo-light.png');
  date: Date = new Date();
  enableDate = signal<boolean>(false);
  enableSite: string[] = [];
  enablePage = signal<string[]>([]);
  woBadge = signal<number>(0);
  lastUpdate = signal<Date | null>(null);
  lastUpdateIntervalMs = signal<number | null>(null);

  private auth =  inject(AuthService);
  private http =  inject(HttpService);
  private pageSrv = inject(PagesService);
  private router =  inject(Router);
  private appInit =  inject(AppInitService);
  private store = inject(Store);
  private theme = inject(ThemeService);
  private dateTimeSrv = inject(Datetime);
  private messageService = inject(MessageService);
  private dialog = inject(FloatingDialogService);

  constructor(){
    this.navState$ = this.store.select(getNavState);
    this.dateState$ = this.store.select(getDateState);
    this.toastState$ = this.store.select(getToastState);
    this.eventSummary$ = this.store.select(getEventSummary);

    this.dateStateSubscription = this.dateState$.subscribe(state => {
      this.date = state.date;
      this.enableDate.set(state.enable);
    });
    this.navStateSubscription = this.navState$.subscribe(state => {
      this.currentNavState.set(state);
      // if(!state.name && !state.location && !this.router.url.includes('billing')){
      //   this.router.navigate(['/'])
      // }
    });
    this.toastStateSubscription = this.toastState$.subscribe(state => {
      if(state && state.message){
        switch (state?.message?.severity) {
          case 'success':
            this.messageService.add({ severity: 'success', summary: 'Success', detail: state.message.detail });
            break;
          case 'info':
            this.messageService.add({ severity: 'info', summary: 'Info', detail: state.message.detail });
            break;
          case 'warn':
            this.messageService.add({ severity: 'warn', summary: 'Warn', detail: state.message.detail });
            break;
          case 'error':
            this.messageService.add({ severity: 'error', summary: 'Error', detail: state.message.detail });
            break;
          case 'secondary':
            this.messageService.add({ severity: 'secondary', summary: 'Secondary', detail: state.message.detail });
            break;
          default:
            break;
        }
      }
    });
    this.sub1 = this.eventSummary$.subscribe(data => {
      this.eventSummary.set(data);
    });
    this.lastUpdateSubscription = this.store.select(getLastUpdateState).subscribe(state => {
      this.lastUpdate.set(state.timestamp);
      this.lastUpdateIntervalMs.set(state.intervalMs);
    });
    // ล้างเวลาอัปเดตตอนเปลี่ยนหน้า กันค่าของหน้าก่อนค้างอยู่
    this.routerSubscription = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.store.dispatch(clearLastUpdate()));
  }

  ngOnInit(): void {
    this.initHeadernavState();
    this.user = localStorage.getItem('user') || '---';
    this.role = localStorage.getItem('role') || '---';
    const theme = localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
    this.mode.set(theme);
    this.theme.setTheme(theme);
    this.logoUrl.set(theme === 'dark' ? 'assets/images/logo-dark.png' : 'assets/images/logo-light.png');
    const pages = localStorage.getItem('pages');
    if(pages){
      this.enablePage.set(JSON.parse(pages));
    }
    this.getSiteConfig();
    this.getEventSummary();
    this.loadMyWoCount();
    if(this.appInit.config.Timer){
      this.startTimer(this.appInit.config.Timer * 60000);
    }
    // const lastLocation = localStorage.getItem('lastLocation');
    // if(lastLocation){
    //   console.log('lastLocation', lastLocation);
    //   this.changeNavState('operation', lastLocation);
    // }
  }

  // นับ WO ที่ assign ให้ตัวเอง เดือนนี้ ที่ยัง active (ไม่นับ closed/cancelled)
  async loadMyWoCount(){
    try {
      const users = await this.http.getUserConfig();
      const me = Array.isArray(users) ? users.find((u: any) => u.username === this.user) : null;
      //)
      const id = me?._id?.toString();
      if(!id){
        this.woBadge.set(0);
        return;
      }
      const ts = new Date();
      const start = new Date(ts.getFullYear(), ts.getMonth(), 2).toISOString().slice(0, 10);
      const end = new Date(ts.getFullYear(), ts.getMonth() + 1, 1).toISOString().slice(0, 10);
      const res = await this.http.getWorkOrdersByAssignee({ start_time: start, end_time: end, assigned_to: id });
      if(res?.status === 'success' && res.data){
        const active = res.data.filter((w: any) => w.status !== 'closed' && w.status !== 'cancelled');
        this.woBadge.set(active.length);
      } else {
        this.woBadge.set(0);
      }
    } catch (_) {
      this.woBadge.set(0);
    }
  }

  openMyWorkOrders(){
    this.store.dispatch(addState({
      payload: {
        name: 'operation',
        location: 'ALL'
      }
    }));
    this.router.navigate(['/main/maintenance']);
  }

  ngAfterViewInit(): void {
    
  }

  ngOnDestroy(): void {
    this.dateStateSubscription?.unsubscribe();
    this.navStateSubscription?.unsubscribe();
    this.toastStateSubscription?.unsubscribe();
    this.sub1?.unsubscribe();
    this.lastUpdateSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
    this.timerSubscription?.unsubscribe();
  }

  show() {
    this.messageService.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Message Content', 
      life: 3000 
    });
  }

  initHeadernavState(){
    const routPage = this.router.url.split('/');
    const lastLocation = localStorage.getItem('lastLocation');
    switch (routPage.length) {
      case 3:
        const pgGroup = this.pageSrv.getPageGroup(routPage[2]);
        if(pgGroup){
          this.store.dispatch(addState({
            payload: {
              name: pgGroup.level,
              location: lastLocation || 'ALL'
            }
          }));
        }
        break;
      case 4:
        const pgGroup2 = this.pageSrv.getPageGroup(routPage[2]);
        if(pgGroup2){
          this.store.dispatch(addState({
            payload: {
              name: pgGroup2.level,
              location: 'ALL'
            }
          }));
        }
        break;
      default:
        break;
    } 
  }

  async getEventSummary(){
    const d = new Date();
    d.setHours(0,0,0,0);
    const tmr = new Date().setDate(d.getDate()+1);
    const request = {
      StartTime: new Date(d).toISOString(),
      EndTime: new Date(tmr).toISOString()
    }
    const result = await this.http.getSummaryAlarmEventData(request);
    if(result.length > 0){
      this.store.dispatch(setEventSummary({ payload: result }));
    } else {
      this.store.dispatch(setEventSummary({ payload: [] }));
    }
  }

  async getSiteConfig(){
    const storeData = localStorage.getItem('sites');
    const avaiableSites: string[] = storeData ? JSON.parse(storeData) : [];
    let config: SiteStateModel | null = null;
    try {
      const res = await this.http.getMasterPlants(false);
      if(res?.status === 'success' && res.data && res.data.length > 0){
        config = mapPlantsToSiteState(res.data.sort((a,b) => a.id - b.id));
      }
    } catch (_) {
      config = null;
    }
    if(!config){
      config = await this.http.getConfig2('assets/sitelist.json');
    }
    if(config){
      const filterSite: SiteStateModel = {
        ...config,
        zoneList: config.zoneList.map(x => {
          return {
            ...x,
            siteList: x.siteList.filter(y => y.enabled && avaiableSites.includes(y.id))
          }
        })
      }
      this.siteConfig.set(filterSite);
      this.store.dispatch(setSite({payload: filterSite}));
      const zonselected = filterSite.zoneList[0];
      this.zoneList.set(zonselected);
      if(filterSite && filterSite.zoneList.length == 1){
        const zonselected = filterSite.zoneList[0];
        this.zoneList.set(zonselected);
        this.initHeadernavState();
      } else {
        this.initHeadernavState();
      }
    }
  }

  startTimer(dueTimer: number) {
    this.timerSubscription = timer(dueTimer, dueTimer).subscribe(x => {
      this.getEventSummary();
      this.loadMyWoCount();
    });
  }

  logOut(){
    this.auth.logout();
  }

  openSettings(){
    this.router.navigate(['/main/setting'])
  }

  showProfileDialog = signal<boolean>(false);

  openProfile(): void {
    this.showProfileDialog.set(true);
  }

  closeProfile(): void {
    this.showProfileDialog.set(false);
  }

  getPlantStatus(pointSource: string){
    const summary = this.eventSummary().find(x => x.PointSource === pointSource);
    if(summary){
      if(summary.Major > 0){
        return 'major-icon'; 
      } else if(summary.Minor > 0){
        return 'minor-icon';
      } else if(summary.Warning > 0){
        return 'warning-icon';
      } else if(summary.Info > 0){
        return 'hide-icon';
      } else {
        return 'hide-icon';
      }
    } else {
      return 'hide-icon';
    } 
  }

  getZoneSelected(name: any){
    //const zone = this.store.selectSnapshot(SiteState.getZoneConfig(name));
    //if(zone){
    //  this.zoneList = zone;
    //  this.isChanged = true;
    //  this.store.dispatch(new AddState({
    //    name: 'zone',
    //    locaion: name
    //  }));
    //  this.navState.set({
    //    name: 'zone',
    //    locaion: name
    //  });
    //  this.router.navigate(['/main/sitelist'])
    //  //
    //}
  }

  zoneTrackBy(index: number, item: ZoneModel) {
    return item.title;
  }

  siteTrackBy(index: number, item: SiteModel) {
    return item.id;
  }

  changeSiteList(name: string){
    //this.isChanged = false;
    //this.navState.set({
    //  name: 'overall',
    //  locaion: name
    //});
    //this.store.dispatch(new AddState({
    //  name: 'overall',
    //  locaion: name
    //}));
    //this.router.navigate(['/main/overview']);
  }

  changeNavState(state: string, name: string, isEnabled: boolean = true){
    if(!isEnabled){
      this.messageService.add({ severity: 'warn', summary: 'Site Disabled', detail: 'This site is currently disabled.' });
      return;
    }
    if(state == 'operation' && this.currentNavState().name != 'operation'){
      this.store.dispatch(addState({
        payload: {
          name: state,
          location: name
        }
      }));
      localStorage.setItem('lastLocation', name);
      this.clearPageState();
      const routPage = this.router.url.split('/');
      if(routPage[2] && this.pageSrv.getSitePages().findIndex(x => x.path === routPage[2]) > -1){

      } else {
        this.router.navigate(['/main/layout'])
      }
    } else {
      this.clearPageState();
      this.store.dispatch(addState({
        payload: {
          name: state,
          location: name
        }
      }));
      localStorage.setItem('lastLocation', name);
    }
  }

  clearPageState(){
    this.store.dispatch(resetLayoutState());
    this.store.dispatch(resetDashboardState());
    this.store.dispatch(resetEfficiencyState());
    this.store.dispatch(resetDiagramState());
    this.store.dispatch(resetTags());
  }

  onSiteChange(event: Event) {
    const selectEl = event.target as HTMLSelectElement;
    const value = selectEl.value;
    this.changeNavState('operation', value);
  }

  searchValue(){
    //const text:string = this.seachText;
    //const zone = [...new Set(this.siteConfig().zoneList.map(
    //  function(item){
    //    return item.siteList.filter(x => x.id.includes(text.toUpperCase()));
    //  }).flat())
    //].sort((a, b) => a.id.toUpperCase().localeCompare(b.id.toUpperCase()));
    //if(zone.length > 0 && text){
    //  this.isChanged = true;
    //  this.zoneList.set({...this.zoneList(), siteList: zone});
    //} else {
    //  this.isChanged = false;
    //}
  }

  toggleNavBarState(){
    this.isHided = !this.isHided;
    // content กว้างเปลี่ยน แต่ไม่มี window resize → บังคับ chart/component reflow
    setTimeout(() => window.dispatchEvent(new Event('resize')), 60);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 320);
  }

  getNumber(val: any) {
    if (typeof val === 'number') {
      const v = +val.toFixed(2);
      return v;
    }
    else {
      return parseInt(val);
    }
  }

  changeColor(name: string){
    if(name == this.currentNavState().location){
      const active = '#10FDD3';
      return active
    } else {
      return '#bcd'
    }
  }

  changeBgColor(name: string){
    if(name == this.currentNavState().location){
      const active = '#2C4549';
      return true;
    } else {
      return false;
    }
  }

  getActiveCard(){
    let result = false
    switch(this.currentNavState().name){
      case 'zone':
        result = true;
        break;
      default:
        result = false;
        break
    }
    if(this.currentNavState().location == 'THAILAND'){
      result = true;
    }
    return result;
  }

  changTheme(){
    if(this.mode() == 'dark'){
      this.theme.setTheme('light');
      this.logoUrl.set('assets/images/logo-light.png');
      this.mode.set('light');
    } else {
      this.theme.setTheme('dark');
      this.logoUrl.set('assets/images/logo-dark.png');
      this.mode.set('dark');
    }   
  }

  onDateSelect(event: any) {
    this.date = event;
    this.store.dispatch(setDate({ payload: this.date }));
  }

  openDialog() {
    this.dialog.open('assistant');
  }

  /** เวลาอัปเดตล่าสุดของหน้าปัจจุบัน (เวลาไทย) — ว่างเมื่อหน้านั้นไม่ได้รีเฟรชข้อมูล */
  lastUpdateText(): string {
    const ts = this.lastUpdate();
    if(!ts){
      return '';
    }
    return this.dateTimeSrv.toBangkok(ts);
  }

  /** ข้อความบอกรอบรีเฟรชของหน้าปัจจุบัน ใช้เป็น tooltip */
  refreshIntervalText(): string {
    const ms = this.lastUpdateIntervalMs();
    if(!ms){
      return 'Auto refresh';
    }
    const seconds = Math.round(ms / 1000);
    return seconds < 60
      ? `Auto refresh every ${seconds} sec`
      : `Auto refresh every ${Math.round(seconds / 60)} min`;
  }

  checkPageAvailable(page: string): boolean {
    if(this.enablePage().length == 0){
      return false;
    } else {
      return this.enablePage().includes(page);
    }
  }

  checkGroupPageAvailable(group: string): boolean {
    if(this.enablePage().length == 0){
      return false;
    } else {
      return this.pageSrv.isHasPageGroup(this.enablePage(), group);
    }
  }


}
