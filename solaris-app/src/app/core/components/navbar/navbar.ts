import { Component, inject, OnInit, signal } from '@angular/core';
import { SiteModel, SiteStateModel, ZoneModel } from '../../../shared/models/config.model';
import { NavbarStateModel } from '../../../shared/models/navigate.model';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../../../shared/services/auth.service';
import { HttpService } from '../../../shared/services/http.service';
import { Router } from '@angular/router';
import { AppInitService } from '../../../shared/services/app-init.service';
import { Store } from '@ngrx/store';
import { AppStateModule } from '../../../store/app.state';
import { getNavState, getLastLocation } from '../../../store/selectors/nav.selectors';
import { addState } from '../../../store/actions/nav.actions';
import { setSite } from '../../../store/actions/site.actions';
import { ThemeService } from '../../../shared/services/theme.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  standalone: false
})
export class Navbar implements OnInit {
  navState$: Observable<NavbarStateModel>;

  siteConfig = signal<SiteStateModel>({ name: '', number: 0, capacity: '', zoneList: [] });
  zoneList = signal<ZoneModel>({ title: '', number: 0, capacity: '', display: '', siteList: [] }); 
  currentNavState = signal<NavbarStateModel>({ name: '', location: '' });
  isChanged: boolean = false;
  isHided: boolean = false;
  seachText: string = '';
  zoneSelected: string = 'OVERVIEW';
  user: string | undefined = '';
  sub1?: Subscription;
  siteName: string = "";
  timers: number = 10;
  mode = signal<'dark' | 'light'>('dark');
  date: Date = new Date();

  private auth =  inject(AuthService);
  private http =  inject(HttpService);
  private router =  inject(Router);
  private appInit =  inject(AppInitService);
  private store = inject(Store);
  private theme = inject(ThemeService);

  constructor(){
    this.navState$ = this.store.select(getNavState);
    this.navState$.subscribe(state => {
      //console.log(state)
      this.currentNavState.set(state);
      if(!state.name && !state.location){
        this.router.navigate(['/'])
      }
    });
  }

  ngOnInit(): void {
    this.user = localStorage.getItem('user') || '---';
    this.getSiteConfig();
  }

  async getSiteConfig(){
    const config: SiteStateModel = await this.http.getConfig2('assets/sitelist.json');
    if(config){
      this.siteConfig.set(config);
      this.store.dispatch(setSite({payload: config}));
      if(config && config.zoneList.length == 1){
        const zonselected = config.zoneList[0];
        this.zoneList.set(zonselected);
        this.store.dispatch(addState({
          payload: {
            name: 'zone',
            location: zonselected.title
          }
        }));
      } else {
        this.store.dispatch(addState({
          payload: {
            name: 'overall',
            location: 'TH'
          }
        }));
      }
    }
  }

  logOut(){
    this.auth.logout();
  }

  openSettings(){
    this.router.navigate(['/main/setting'])
  }

  getZoneSelected(name: any){
    ////console.log();
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
    //  ////console.log(name)
    //}
    ////console.log(this.zoneList)
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

  changeNavState(state: string, name: string){
    this.store.dispatch(addState({
      payload: {
        name: state,
        location: name
      }
    }));

    if(state == 'site'){
      this.router.navigate(['/main/layout'])
    } else {
      //this.router.navigate(['/main/overview'])
    }
  }

  onSiteChange(event: Event) {
    const selectEl = event.target as HTMLSelectElement;
    const value = selectEl.value;
    this.changeNavState('site', value);
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
      this.mode.set('light');
    } else {
      this.theme.setTheme('dark');
      this.mode.set('dark');
    }   
  }

  onDateSelect(event: any) {
    this.date = event;
  }

}
