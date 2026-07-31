import { Component, computed, inject, OnChanges, OnDestroy, OnInit, signal } from '@angular/core';
import { GroupHistorianConfigModel, GroupReatimeConfigModel, HistorianConfig, PageConfigModel, RealtimeConfig, SiteModel } from '../../../../shared/models/config.model';
import { HttpService } from '../../../../shared/services/http.service';
import { Store } from '@ngrx/store';
import { AppInitService } from '../../../../shared/services/app-init.service';
import { Datetime } from '../../../../shared/services/datetime';
import { firstValueFrom, Observable, Subscription, timer } from 'rxjs';
import { NavbarStateModel } from '../../../../shared/models/navigate.model';
import { GroupRequestAtTimeModel, GroupRequestHistorianModel, GroupRequestRealtimeModel, RequestAtTimeModel, RequestHistorianModel } from '../../../../shared/models/request.model';
import { DataHistorianModel, DataRealtimeModel, ResponseHistorianModel, ResponseRealtimeModel } from '../../../../shared/models/response.model';
import { ChartService } from '../../../../shared/services/chart.service';
import { SeriesAreaOptions, SeriesColumnOptions, SeriesLineOptions, SeriesOptionsType } from 'highcharts';
import { getNavState } from '../../../../store/selectors/nav.selectors';
import { getZoneConfig } from '../../../../store/selectors/site.selectors';
import { MapConfigModel } from '../../../../shared/models/svg.model';
import { PlantStatusData } from '../../../../shared/components/piechart/piechart';
import { setDateEnable } from '../../../../store/actions/date.actions';
import { ColorRangeModel, PanelConfigModel } from '../../../../shared/models/panel.model';
import { ChartPickerModel } from '../../../../shared/components/chart-card/chart-card';
import { AliasList, DecodedAlarm, RealtimeDataModel, StatusMapping, TagParameter, TagsConfigList, TagsListConfig } from '../../../../shared/models/realtime.model';
import { TooltipFormat } from '../../../../shared/services/tooltip-format';
import { setLastUpdate } from '../../../../store/actions/last-update.actions';

/** รอบรีเฟรชของหน้า Realtime — ถี่กว่าค่ากลาง config.Timer ตามที่ลูกค้าขอ */
const REFRESH_INTERVAL_MS = 30 * 1000;

@Component({
  selector: 'app-realtime',
  standalone: false,
  templateUrl: './realtime.html',
  styleUrl: './realtime.scss'
})
export class Realtime implements OnInit, OnDestroy {

  navState$: Observable<NavbarStateModel>;

  configTags = signal<TagsListConfig[]>([]);
  tagsGroupConfig = computed(() => {
    const value = this.configTags().map(function( item ){
      let val: AliasList[] = [];
      let alias = item.parameters.forEach( x => {
        let res = x.sheets?.reduce((acc, cur) => {
          let i = val.find(x => x.name == cur);
          if(!i){
            val.push({name: cur, status: false});
          }
          return acc;
        }, []);
      });
      let res: TagsConfigList = {
        Name: item.name,
        Status: false,
        Alias: val
      };
      return res;
    });
    return value;
  });
  sortKey = signal<string>('');
  sortType = signal<string>('');

  tableData = computed(() => {
    const item: any[] = [];
    const key = this.sortKey();
    const type = this.sortType();
    if(this.tableRow() && this.tableHeader() && this.responseRealtime()){
      this.tableRow().forEach(x => {
        let row:any = {};
        let latest = '';
        this.tableHeader().forEach( i => {
          if(i.name === 'NAME' || i.name === 'LASTSEEN'){
            return;
          }
          const cell = this.responseRealtime().find( d => d.Name === this.siteSelected() + '.' + x + '.' + i.name);
          row[i.name] = cell;
          if(cell?.TimeStamp && (!latest || new Date(cell.TimeStamp) > new Date(latest))){
            latest = cell.TimeStamp;
          }
        });
        row['NAME'] = {Name: x, Value: x, Unit: '', TimeStamp: '', Min: 0, Max: 0};
        row['LASTSEEN'] = latest || '---';
        item.push(row);
      });
    }
    if(key){
      item.sort((a,b) => {
        if(key === 'LASTSEEN'){
          const av = a.LASTSEEN === '---' ? 0 : new Date(a.LASTSEEN).getTime();
          const bv = b.LASTSEEN === '---' ? 0 : new Date(b.LASTSEEN).getTime();
          return type === 'asc' ? av - bv : bv - av;
        }
        const av = this.tranformNumber(a[key]?.Value);
        const bv = this.tranformNumber(b[key]?.Value);
        return type === 'asc' ? av - bv : bv - av;
      });
    }
    return item;
  });

  requestRealtime = signal<GroupRequestRealtimeModel[]>([]);
  requestAttime = signal<GroupRequestAtTimeModel[]>([]);
  requestHistorian = signal<GroupRequestHistorianModel[]>([]);

  responseRealtime = signal<ResponseRealtimeModel[]>([]);
  responseHistorian = signal<ResponseHistorianModel[]>([]);

  dataChart = signal<any>({});
  dataRealtime = signal<DataRealtimeModel>({});
  dataHistorian = signal<DataHistorianModel>({});
  tableHeader = signal<TagParameter[]>([]);
  tableRow = signal<string[]>([]);
  dataTable = signal<any[]>([]);

  siteList = signal<SiteModel[]>([]);
  siteSelected = signal<string>('');

  zoneSelected = signal<string>('overall');
  mapConfig = signal<MapConfigModel>({} as MapConfigModel);
  
  timers?: Subscription;
  navSub?: Subscription;
  storeSub?: Subscription;
  storeSub2?: Subscription;
  isFetching = false;

  date: Date = new Date();

  private http = inject(HttpService);
  private store = inject(Store);
  private appInit = inject(AppInitService);
  private chartOptions = inject(ChartService);
  private dateTimeSrv = inject(Datetime);
  tooltipSrv = inject(TooltipFormat);

  constructor(){
    this.navState$ = this.store.select(getNavState);
    this.navSub = this.navState$.subscribe(async (state) => {
      this.siteSelected.set(state.location);
      const res = await firstValueFrom(
        this.store.select(getZoneConfig(state.location))
      );
      if(res && res.siteList){
        this.siteList.set(res.siteList);
      };
      this.resetPage();
      await this.initPage();
    });
  }

  onDateSelect(event: any) {
    this.date = event;
  }

  ngOnInit(): void {
    this.initPage();
  }

  ngOnDestroy(): void {
    if(this.timers){
      this.timers.unsubscribe();
    }
    if(this.navSub){
      this.navSub.unsubscribe();
    }
    if(this.storeSub){
      this.storeSub.unsubscribe();
    }
    if(this.storeSub2){
      this.storeSub2.unsubscribe();
    }
  }

  resetPage(){
    this.requestRealtime.set([]);
    this.requestAttime.set([]);
    this.requestHistorian.set([]);
    this.responseRealtime.set([]);
    this.responseHistorian.set([]);
    this.dataChart.set({});
    this.dataRealtime.set({});
    this.dataHistorian.set({});
    this.configTags.set([]);
    this.tableHeader.set([]);
    this.tableRow.set([]);
  }

  async initPage(){
    this.timers?.unsubscribe();
    
    if (!false) {
      await this.getConfig();
    }
    this.tagsGroupConfig()[0].Status = true;
    this.tagsGroupConfig()[0].Alias[0].status = true;

    this.getRealtimeRequest();
    await this.getRealtimeData();
    this.startTimer(REFRESH_INTERVAL_MS);

  }

  async getConfig() {
    try {
      const config = await this.http.getConfig2(`assets/site/realtime/configurations/realtime[${this.siteSelected()}].config.json`);
      if (config) {
        this.configTags.set(config);
      }
    } catch (error) {
      //console.error('Error fetching config', error);
    }
  }

  getRealtimeRequest(){
    this.requestRealtime.set([]);
    this.tableHeader.set([{
      name: "NAME",
      title: "NAME",
      width: "5.25rem"
    }]);
    let tags: TagParameter[] = [];
    let tagList: string[] = [];
    let gname = this.tagsGroupConfig().find(x => x.Status == true);
    let aname = gname?.Alias.find(x => x.status == true);
    const group = this.configTags().find(x => x.name == gname?.Name);
    const lastseenParam = group?.parameters.find(p => p.name == 'LASTSEEN');
    if(lastseenParam){
      this.tableHeader.update(val => [...val, lastseenParam]);
    }
    const eqpName = this.configTags().find(x => x.name == gname?.Name)?.equipments.map(x => x.name).sort((a, b) => {
      if (a < b) { return -1; }
      if (a > b) { return 1; }
      return 0;
    });
    const tagName = this.configTags().find(x => x.name == gname?.Name)?.parameters.reduce((acc, cur) => {
      let chk = cur.sheets?.find( i => i == aname?.name);
      if(chk){
        acc.push(cur);
      }
      return acc;
    }, tags)
    if(eqpName && tagName){
      this.tableHeader.update(val => val.concat(tagName));
      this.tableRow.set(eqpName);
    }
    //console.log(this.tableHeader(), this.tableRow(), this.tableData())
    const request = eqpName?.reduce((acc, cur, index) => {
      let res = tagName?.map(x => this.siteSelected() + '.' + cur + '.' + x.name);
      if(res){
        this.requestRealtime.update(val => {
          val.push({ 
            Group: 'initial' + index,
            Order: index,
            Request: {
              Tags: res
            }
          });
          return val;
        });
        return [...acc, ...res];
      };
      return acc;
    }, tagList);
    if(request){  
    }
  }

  async getRealtimeData(){
    if (this.requestRealtime() && this.requestRealtime().length > 0) {
      const result = this.requestRealtime().map(async(item) => {
        const request = item.Request;
        const response:ResponseRealtimeModel[] = await this.http.getRealtime(request);
        if(response){
          response.map(data => {
            this.responseRealtime.update(val => [...val, data]);
          });
        }
        return response;
      });
      const res = await Promise.allSettled(result);
      if (res) {
        // this.store.dispatch(DashboardActions.loadDashboardRealtimeDataSuccess({ data: this.dataRealtime() }));
      }
    }
  }

  startTimer(dueTimer: number) {
    // แจ้งเวลาอัปเดตล่าสุดทันทีที่โหลดเสร็จ แล้วแจ้งซ้ำทุกรอบรีเฟรช
    this.publishLastUpdate(dueTimer);
    this.timers = timer(dueTimer, dueTimer).subscribe(async x => {
      await this.updateData();
      this.publishLastUpdate(dueTimer);
    });
  }

  private publishLastUpdate(intervalMs: number){
    this.store.dispatch(setLastUpdate({ payload: { timestamp: new Date(), intervalMs } }));
  }

  async updateData(){
    // ข้ามรอบถ้ารอบก่อนยังไม่เสร็จ กัน request กองกันตอน API ช้า
    if(this.isFetching){
      return;
    }
    this.isFetching = true;
    try {
      this.responseRealtime.set([]);
      this.getRealtimeRequest();
      await this.getRealtimeData();
    } finally {
      this.isFetching = false;
    }
  }

  trackByKey = (index: number, item: RealtimeDataModel) => item.group;

  getNumber(val: any) {
    if (typeof val === 'number') {
      const v = +val.toFixed(2);
      return v;
    }
    else {
      if(val != null){
        return parseInt(val.replace(',', '')).toLocaleString();
      } else {
        return 'null'
      }
    }
  }

  async emitTags(){
    this.getRealtimeRequest();
    await this.getRealtimeData();
  }

  searchValue(name: string) {
    const data = this.responseRealtime().find( i => i.Name == name);
    if(data){
      return data.Value;
    } else {
      return '-';
    }
  }

  searchUnit(name: string) {
    const data = this.responseRealtime().find( i => i.Name == name);
    if(data){
      return data.Unit;
    } else {
      return '-';
    }
  }

  async selectGroup(item: any, index: number){
    this.tagsGroupConfig().map(function(x){
      x.Status = false;
      return x;
    })
    this.tagsGroupConfig()[index].Alias.map(function(x){
      x.status = false;
      return x;
    })
    item.Alias[0].status = true;
    item.Status = true;
    await this.emitTags();
    return item;
  }

  async selectAlias(item: AliasList, index: number){
    this.tagsGroupConfig()[index].Alias.map(function(x){
      x.status = false;
      return x;
    });
    item.status = true;
    await this.emitTags();
    return item;
  }

  sortDatatable(key: string, type: string){
    this.sortKey.set(key);
    this.sortType.set(type);
  }

  getLastSeen(item: string){
    if(!item || item === '---'){
      return 'gray';
    }
    const ts = new Date(item);
    if(isNaN(ts.getTime())){
      return 'gray';
    }
    if(this.date >= ts){
      const m = (this.date.getTime() - ts.getTime()) / (60 * 1000);
      switch(true){
        case m >= 1440: return 'seen-danger';
        case m >= 60: return 'seen-warning';
        case m < 60: return 'seen-now';
        default: return 'gray';
      }
    }
    return 'seen-now';
  }

  private activeGroupMapping(param: string): StatusMapping | undefined {
    const gname = this.tagsGroupConfig().find(x => x.Status == true);
    const group = this.configTags().find(x => x.name == gname?.Name);
    return group?.mapping?.[param];
  }

  decodeStatus(param: string, value: any): { label: string; level: string } {
    const map = this.activeGroupMapping(param);
    if(value == null || value === ''){
      return { label: '---', level: 'gray' };
    }
    const code = parseInt(value.toString().trim(), value.toString().trim().startsWith('0x') ? 16 : 10);
    const hit = map?.values?.[code.toString()];
    if(hit){
      return hit;
    }
    return { label: value.toString(), level: 'gray' };
  }

  decodeAlarm(param: string, value: any): DecodedAlarm[] {
    const map = this.activeGroupMapping(param);
    if(value == null || value === '' || !map?.bits){
      return [];
    }
    const code = parseInt(value.toString().trim(), value.toString().trim().startsWith('0x') ? 16 : 10);
    if(isNaN(code) || code === 0){
      return [];
    }
    return map.bits.filter(b => (code & (1 << b.bit)) !== 0);
  }

  alarmLevelClass(level: string): string {
    switch(level){
      case 'Major': return 'lv-major';
      case 'Minor': return 'lv-minor';
      case 'Warning': return 'lv-warning';
      default: return 'lv-minor';
    }
  }

  tranformNumber(val: string){
    if(val == null){
      val = "-1";
    }
    const res = parseFloat(val);
    if(res >= 0){
      return res;
    } else {
      return -1;
    }
  }
   
}
