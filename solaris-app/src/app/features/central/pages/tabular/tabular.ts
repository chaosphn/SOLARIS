import { Component, computed, inject, OnChanges, OnDestroy, OnInit, signal } from '@angular/core';
import { GroupHistorianConfigModel, GroupReatimeConfigModel, HistorianConfig, PageConfigModel, RealtimeConfig, SiteModel } from '../../../../shared/models/config.model';
import { HttpService } from '../../../../shared/services/http.service';
import { Store } from '@ngrx/store';
import { AppInitService } from '../../../../shared/services/app-init.service';
import { Datetime } from '../../../../shared/services/datetime';
import { firstValueFrom, Observable, Subscription, timer } from 'rxjs';
import { DateStateModel, NavbarStateModel } from '../../../../shared/models/navigate.model';
import { GroupRequestAtTimeModel, GroupRequestHistorianModel, GroupRequestRealtimeModel, RequestAtTimeModel } from '../../../../shared/models/request.model';
import { DataHistorianModel, DataRealtimeModel, ResponseHistorianModel, ResponseRealtimeModel } from '../../../../shared/models/response.model';
import { ChartService } from '../../../../shared/services/chart.service';
import { SeriesAreaOptions, SeriesColumnOptions, SeriesLineOptions, SeriesOptionsType } from 'highcharts';
import * as TabularActions from '../../store/actions/tabular.action';
import * as TabularSelectors from '../../store/selectors/tabular.selector';
import { getNavState } from '../../../../store/selectors/nav.selectors';
import { getZoneConfig } from '../../../../store/selectors/site.selectors';
import { getDateState } from '../../../../store/selectors/date.selectors';
import { setDateEnable } from '../../../../store/actions/date.actions';
import { TabularConfigModel } from '../../models/tabular.model';
import { EventSummaryModel } from '../../../sites/models/event.model';
import { setLastUpdate } from '../../../../store/actions/last-update.actions';


@Component({
  selector: 'app-tabular',
  standalone: false,
  templateUrl: './tabular.html',
  styleUrl: './tabular.scss'
})
export class Tabular implements OnInit, OnDestroy {
  dateState$: Observable<DateStateModel>;
  navState$: Observable<NavbarStateModel>;

  config = signal<PageConfigModel>({
    realtimeConfig: [],
    historianConfig: [],
    chartConfig: []
  });

  requestRealtime = signal<GroupRequestRealtimeModel[]>([]);
  requestAttime = signal<GroupRequestAtTimeModel[]>([]);
  requestHistorian = signal<GroupRequestHistorianModel[]>([]);

  responseRealtime = signal<ResponseRealtimeModel[]>([]);
  responseHistorian = signal<ResponseHistorianModel[]>([]);

  dataChart = signal<any>({});
  dataRealtime = signal<DataRealtimeModel>({});
  dataHistorian = signal<DataHistorianModel>({});

  siteList = signal<SiteModel[]>([]);

  zoneSelected = signal<string>('overall');
  cardProperty = signal<any[]>([]);

  eventSummary = signal<EventSummaryModel[]>([]);
  
  timers?: Subscription;
  dateStateSubscription?: Subscription;
  storeSub?: Subscription;
  storeSub2?: Subscription;

  date: Date = new Date();

  tableConfig = signal<TabularConfigModel[]>([]);
  sortKey = signal<string>('');
  sortType = signal<string>('');
  searchText = signal<string>('');
  statusFilter = signal<string>('all');
  refreshing = signal<boolean>(false);
  tableData = computed(() => {
    const sites = this.siteList();
    const config = this.tableConfig();
    const realtime = this.dataRealtime();
    const key = this.sortKey();
    const type = this.sortType();


    const result: any[] = [];

    if (sites && config) {
      sites.forEach(item => {
        const row: any = {};

        config.forEach(h => {
          const nameLower = h.Name.toLowerCase();
          
          switch (nameLower) {
            case 'id':
              row[h.Name] = item.id;
              break;
            case 'name':
              row[h.Name] = item.name;
              break;
            case 'location':
            case 'province': // Handle both location and province
              const locationParts = item.location.split(',').map(part => part.trim());
              row[h.Name] = locationParts.length > 0 ? locationParts[locationParts.length-1] : item.location;
              break;
            case 'capacity':
              row[h.Name] = item.capacity;
              break;
            case 'seen': 
              row[h.Name] = realtime?.[`${item.id}_TIMEREF`]?.TimeStamp || '---';
              break;
            default:
              // Debug: log what we're looking for
              row[h.Name] = realtime?.[`${item.id}_${h.Name}`]?.Value ?? '---';
          }
        });

        result.push(row);
      });
    }

    
    return result.sort((a,b) => {
      if (type === 'asc') {
        return a[key] - b[key];
      } else {
        return b[key] - a[key];
      }
    });;
  });

  filteredData = computed(() => {
    const search = this.searchText().toLowerCase().trim();
    const status = this.statusFilter();
    return this.tableData().filter(row => {
      const matchSearch = !search ||
        row.Id?.toString().toLowerCase().includes(search) ||
        row.Name?.toString().toLowerCase().includes(search) ||
        row.Province?.toString().toLowerCase().includes(search);
      if(!matchSearch){
        return false;
      }
      if(status === 'all'){
        return true;
      }
      const ts = row.SEEN;
      const st = this.getPlantStatus(row.Id);
      const isStale = this.isSeenStale(ts);
      switch(status){
        case 'issue':
          return st === 'major' || st === 'minor' || st === 'warning' || isStale;
        case 'warning':
          return st === 'warning' || isStale;
        case 'alarm':
          return st === 'major' || st === 'minor';
        default:
          return true;
      }
    });
  });

  tableSummary = computed(() => {
    const rows = this.filteredData();
    const num = (val: any) => {
      const v = parseFloat(val);
      return isNaN(v) ? null : v;
    };
    const sum = (key: string) => rows.reduce((acc, r) => acc + (num(r[key]) ?? 0), 0);
    const avg = (key: string) => {
      const vals = rows.map(r => num(r[key])).filter((v): v is number => v !== null);
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    return {
      count: rows.length,
      Capacity: sum('Capacity'),
      POWER: sum('POWER'),
      ENERGY: sum('ENERGY'),
      ENERGYMTD: sum('ENERGYMTD'),
      ENERGYYTD: sum('ENERGYYTD'),
      PR: avg('PR'),
      AVAI: avg('AVAI'),
      LOSS: sum('LOSS'),
      TD: avg('TD'),
      MTD: avg('MTD'),
      YTD: avg('YTD'),
      REV_TD: sum('REV_TD'),
      REV_MTD: sum('REV_MTD'),
      IRR: avg('IRR'),
      PV: avg('PV'),
      AMB: avg('AMB')
    };
  });

  private http = inject(HttpService);
  private store = inject(Store);
  private appInit = inject(AppInitService);
  private chartOptions = inject(ChartService);
  private dateTimeSrv = inject(Datetime);
  constructor(){
    this.navState$ = this.store.select(getNavState);
    this.navState$.subscribe(async (state) => {
      const res = await firstValueFrom(
        this.store.select(getZoneConfig(state.location))
      );
      if(res && res.siteList){
        this.siteList.set(res.siteList);
      }
    });
    this.dateState$ = this.store.select(getDateState);
  }

  ngOnInit(): void {
    //this.store.dispatch(setDateEnable({ payload: true }));
    this.initPage();
  }

  ngOnDestroy(): void {
    if(this.timers){
      this.timers.unsubscribe();
    }
    if(this.dateStateSubscription){
      this.dateStateSubscription.unsubscribe();
    }
    if(this.storeSub){
      this.storeSub.unsubscribe();
    }
    if(this.storeSub2){
      this.storeSub2.unsubscribe();
    }
    this.store.dispatch(setDateEnable({ payload: false }));
    this.store.dispatch(setDateEnable({ payload: false }));
  }

  async initPage(){
    this.timers?.unsubscribe();
    // Check if data exists in store first
    const hasConfig = await this.loadFromStoreIfExists();
    
    if (!hasConfig) {
      await this.getConfig();
      this.store.dispatch(TabularActions.loadTabularConfigTimeStamp({ timestamp: new Date() }));
    }

    await this.getCardConfig();
    
    this.getRequest();
    await this.getData();
    await this.getEventSummary();
    
    if(this.appInit.config.Timer){
      this.startTimer(this.appInit.config.Timer * 60000);
    }
  }

  private async loadFromStoreIfExists(): Promise<boolean> {
    return new Promise((resolve) => {
      this.storeSub = this.store.select(TabularSelectors.selectTabularState).subscribe(state => {
        let hasData = false;
        
        // Check if config exists and load it
        if (state.config && state.config.realtimeConfig.length > 0) {
          this.config.set(state.config);
          hasData = true;
        }
        
        // Check if requests exist and load them
        if (state.req_realtime && state.req_realtime.length > 0) {
          this.requestRealtime.set(state.req_realtime);
          hasData = true;
        }
        
        if (state.req_attime && state.req_attime.length > 0) {
          this.requestAttime.set(state.req_attime);
          hasData = true;
        }
        
        if (state.req_historian && state.req_historian.length > 0) {
          this.requestHistorian.set(state.req_historian);
          hasData = true;
        }
        
        // Check if data exists and load it
        if (state.data_realtime && Object.keys(state.data_realtime).length > 0) {
          this.dataRealtime.set(state.data_realtime);
          hasData = true;
        }
        
        if (state.data_historian && Object.keys(state.data_historian).length > 0) {
          this.dataHistorian.set(state.data_historian);
          hasData = true;
        }
        
        if (state.data_chart && Object.keys(state.data_chart).length > 0) {
          this.dataChart.set(state.data_chart);
          hasData = true;
        }
        
        resolve(hasData);
      });
    });
  }

  async getConfig() {
    try {
      // const path = this.date.getDate() == new Date().getDate() ? 
      //   `assets/central/performance/configurations/performance.config.json` :
      //   `assets/central/performance/configurations/performance2.config.json` ;
      const config = await this.http.getConfig2(`assets/central/tabular/configurations/tabular.config.json`);
      if (config) {
        this.config.set(config);
        this.store.dispatch(TabularActions.loadTabularConfigSuccess({ config }));
      }
    } catch (error) {
      //console.error('Error fetching config', error);
      this.store.dispatch(TabularActions.loadTabularConfigFailure({ error: error as string }));
    }
  }

  async getCardConfig(){
    const config = await this.http.getConfig2(`assets/central/tabular/property/table.config.json`);
    if (config) {
      this.tableConfig.set(config);
    }
  }

  getRequest(){
    // Only generate requests if they don't exist
    if (!this.requestRealtime() || this.requestRealtime().length === 0) {
      this.getRealtimeRequest();
    }
    if (!this.requestAttime() || this.requestAttime().length === 0) {
      this.getAttimeRequest();
    }
    if (!this.requestHistorian() || this.requestHistorian().length === 0) {
      this.getHistorianRequest();
    }
  }

  getRealtimeRequest(){
    const req: GroupRequestRealtimeModel[] = this.config().realtimeConfig.map((item: GroupReatimeConfigModel) => {
      return {
        Group: item.Group,
        Order: item.Order,
        Request: {
          Tags: item.Tags.filter(x => !x.Timestamp).map(y => y.Tagname)
        }
      }
    }).filter(x => x.Request.Tags.length > 0);
    if(req){
      const sortedReq = req.sort((a,b) => a.Order - b.Order);
      this.requestRealtime.set(sortedReq);
      this.store.dispatch(TabularActions.loadTabularRealtimeData({ requests: sortedReq }));
    }
  }

  getAttimeRequest(){
    const req: GroupRequestAtTimeModel[] = this.config().realtimeConfig.map((item: GroupReatimeConfigModel) => {
      return {
        Group: item.Group,
        Order: item.Order,
        Request: item.Tags.filter(x => x.Timestamp).reduce((acc: RequestAtTimeModel[], cur: RealtimeConfig) => {
          const timestamp = cur.Timestamp ? this.dateTimeSrv.getTime(cur.Timestamp) : null;
          const findItem = acc.find(x => x.TimeStamp === timestamp);
          if(findItem){
            findItem.Tags.push(cur.Tagname);
          } else {
            if(timestamp){
              acc.push({
                Tags: [cur.Tagname],
                TimeStamp: timestamp
              })
            }
          }
          return acc;
        }, [])
      }
    });
    if(req){
      const sortedReq = req.sort((a,b) => a.Order - b.Order);
      this.requestAttime.set(sortedReq);
      this.store.dispatch(TabularActions.loadTabularAtTimeData({ requests: sortedReq }));
    }
  }

  getAttimeRequest2(){
    const ts = this.date.setHours(23,0,0);
    const req: GroupRequestAtTimeModel[] = this.config().realtimeConfig.map((item: GroupReatimeConfigModel) => {
      const rq: RequestAtTimeModel[] = [
        {
          Tags: item.Tags.filter(x => !x.Timestamp).map(y => y.Tagname),
          TimeStamp: this.dateTimeSrv.getDateTime1(new Date(ts))
        }
      ];
      return {
        Group: item.Group,
        Order: item.Order,
        Request: rq
      }
    });
    if(req){
      const sortedReq = req.sort((a,b) => a.Order - b.Order);
      this.requestAttime.set(sortedReq);
      this.store.dispatch(TabularActions.loadTabularAtTimeData({ requests: sortedReq }));
    }
  }

  getHistorianRequest(){
    const req: GroupRequestHistorianModel[] = this.config().historianConfig.map((item: GroupHistorianConfigModel) => {
      const start = new Date(this.date.setHours(0,0,0,0));
      const end = new Date(this.date.setHours(23,59,59,0));
      return {
        Group: item.Group,
        Order: item.Order,
        Request: item.Tags.map((x: HistorianConfig) => {
          return {
            Name: x.Tagname,
            Options: {
              Interval: x.Options.Interval ?? undefined,
              Time: '',
              StartTime: this.dateTimeSrv.getDateTime1(start),
              EndTime: this.dateTimeSrv.getDateTime1(end)
            }
          }
        })
      }
    });
    if(req){
      const sortedReq = req.sort((a,b) => a.Order - b.Order);
      this.requestHistorian.set(sortedReq);
      this.store.dispatch(TabularActions.loadTabularHistorianData({ requests: sortedReq }));
    }
  }

  async getData(){
    // Check if data needs to be refreshed based on timestamp
    const shouldRefresh = await this.shouldRefreshData();
    
    // Only fetch data if it doesn't exist or needs refresh
    if (!this.dataRealtime() || Object.keys(this.dataRealtime()).length === 0 || shouldRefresh) {
      await this.getRealtimeData();
      this.store.dispatch(TabularActions.loadTabularConfigTimeStamp({ timestamp: new Date() }))
    }
    //await this.getAtTimeData();
    if (!this.dataHistorian() || Object.keys(this.dataHistorian()).length === 0 || shouldRefresh) {
      await this.getHistorianData();
      this.store.dispatch(TabularActions.loadTabularConfigTimeStamp({ timestamp: new Date() }))
    }
  }

  private async shouldRefreshData(): Promise<boolean> {
    return new Promise((resolve) => {
      this.storeSub2 = this.store.select(TabularSelectors.selectTabularTimestamp).subscribe(timestamp => {
        if (!timestamp) {
          resolve(true); // No timestamp means first time, should refresh
          return;
        }
        
        const now = new Date();
        const timeDiff = now.getTime() - new Date(timestamp).getTime();
        const minutesDiff = timeDiff / (1000 * 60); // Convert to minutes
        
        if (minutesDiff > 2) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }

  async getRealtimeData(){
    if (this.requestRealtime() && this.requestRealtime().length > 0) {
      const result = this.requestRealtime().map(async(item) => {
        const request = item.Request;
        const response:ResponseRealtimeModel[] = await this.http.getRealtime(request);
        if(response){
          response.map(data => {
            const conf = this.config().realtimeConfig.find(x => x.Group == item.Group)?.Tags.find(y => y.Tagname == data.Name && !y.Timestamp);
            if (conf) {
              this.dataRealtime.update(val => ({
                ...val,
                [conf.Title]: {
                  ...data,
                  Value: parseFloat(data.Value.toString().replaceAll(',', ''))
                }
              }));
            }
            this.responseRealtime.update(val => [...val, data]);
          });
        }
        return response;
      });
      const res = await Promise.allSettled(result);
      if (res) {
        this.store.dispatch(TabularActions.loadTabularRealtimeDataSuccess({ data: this.dataRealtime() }));
      }
    }
  }

  async getAtTimeData(){
    if (this.requestAttime() && this.requestAttime().length > 0) {
      for await (const req of this.requestAttime()) {
        const result = req.Request.map(async(item) => {
          const request = item;
          const response:ResponseHistorianModel[] = await this.http.getAtTime([request]);
          if(response){
            response.map(data => {
              const conf = this.config().realtimeConfig.find(x => x.Group == req.Group)?.Tags.find(y => y.Tagname == data.Name);
              if (conf) {
                const datas: ResponseRealtimeModel = {
                  Name: data.Name,
                  Min: data.Min,
                  Max: data.Max,
                  Unit: data.Unit,
                  Value: data.records ? parseFloat(data.records[0].Value) : 0,
                  TimeStamp:  data.records ? data.records[0].TimeStamp : '',
                };
                this.dataRealtime.update(val => ({
                  ...val,
                  [conf.Title]: datas
                }));
              };
              this.responseRealtime.update(val => {
                  const datas: ResponseRealtimeModel = {
                    Name: data.Name,
                    Min: data.Min,
                    Max: data.Max,
                    Unit: data.Unit,
                    Value: data.records ? parseFloat(data.records[0].Value) : 0,
                    TimeStamp:  data.records ? data.records[0].TimeStamp : '',
                  };
                  const newVal = [...val, datas];
                  return newVal;
              });
            });
          }
          return response;
        });
        const res = await Promise.allSettled(result);
      }
      this.store.dispatch(TabularActions.loadTabularRealtimeDataSuccess({ data: this.dataRealtime() }));
    }
  }

  async getHistorianData(){
    if (this.requestHistorian() && this.requestHistorian().length > 0) {
      const result = this.requestHistorian().map(async(item) => {
        const request = item.Request;
        const response:ResponseHistorianModel[] = await this.http.getHistorian(request);
        if(response){
          // Create a new object instead of mutating the existing one
          this.dataChart.update(val => {
            // Clone the existing object first
            const newVal = { ...val };
            
            let conf = this.config().chartConfig.find(x => x.name == item.Group);
            let series: SeriesOptionsType[] | SeriesLineOptions[] | SeriesAreaOptions[] | SeriesColumnOptions[] = []; 
            if(conf){
              conf.tags.forEach((x, index) => {                 
                let data = response.find(d => d.Name == x.name);
                if(data && data.records){
                  let res = this.chartOptions.getSeriesOptions(x.title, x.options, data);
                  series.push(res);
                }
              })
              
              // Create a new chart config object
              newVal[item.Group] = {
                chart: this.chartOptions.getChartOptions(conf.chartOptions.chart),
                title: this.chartOptions.getTitleOptions(conf.chartOptions.title),
                xAxis: this.chartOptions.getXAxisoptions({}),
                yAxis: this.chartOptions.getYAxisoptions(conf.chartOptions.yAxis),
                legend: this.chartOptions.getLegendOptions(conf.chartOptions.legend),
                plotOptions: this.chartOptions.getPlotOptions(conf.chartOptions.plotOptions),
                series: [...series] // Clone array
              };
            }
            // Return the entire new object
            return newVal;
          });
          
          response.map(data => {
            const conf = this.config().historianConfig.find(x => x.Group == item.Group)?.Tags.find(y => y.Tagname == data.Name);
            if (conf) {
              this.dataHistorian.update(val => ({
                ...val,
                [conf.Title]: data
              }));
            }
            this.responseHistorian.update(val => [...val, data]);
          });
        }
        return response;
      });
      
      const res = await Promise.allSettled(result);
      if(res){
        this.store.dispatch(TabularActions.loadTabularChartDataSuccess({ data: this.dataChart() }));
        this.store.dispatch(TabularActions.loadTabularHistorianDataSuccess({ data: this.dataHistorian() }));
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
    await this.getRealtimeData();
    //await this.getAtTimeData();
    await this.getHistorianData();
    await this.getEventSummary();
  }

  getLastSeen(item: string){
      if(!item || item === '---'){
        return 'gray';
      }
      const ts = new Date(item);
      if(isNaN(ts.getTime())){
        return 'gray';
      }
      if(this.date >= ts ){
        const time = this.date.getTime() - (ts.getTime());
        const m = time/(60 * 1000);
        let className: string = "gray";
        switch(true){
          case m >= 1440:
            className = 'seen-danger';
            break;
          case m >= 60:
            className = 'seen-warning';
            break;
          case m < 1:
            className = 'seen-now';
            break;
          default:
            className = 'gray';
            break;
        }
        return className;
      } else {
        return "seen-now";
      }
  }

  /** ไซต์ถือว่า ONLINE เมื่อข้อมูลล่าสุดยังไม่เกินเกณฑ์ stale (60 นาที) */
  getOnlineStatus(seen: string): 'ONLINE' | 'OFFLINE' {
    return this.isSeenStale(seen) ? 'OFFLINE' : 'ONLINE';
  }

  /** ระดับ alarm เป็นข้อความสำหรับไฟล์ export */
  getAlarmLevel(pointSource: string): string {
    switch(this.getPlantStatus(pointSource)){
      case 'major':   return 'MAJOR';
      case 'minor':   return 'MINOR';
      case 'warning': return 'WARNING';
      case 'info':    return 'NORMAL';
      default:        return 'NO DATA';
    }
  }

  /** อธิบาย alarm พร้อมเตือนเมื่อไซต์ offline เพราะค่าที่เห็นเป็นค่าค้างจากรอบสุดท้าย */
  getAlarmTooltip(pointSource: string, seen: string): string {
    const level = this.getAlarmLevel(pointSource);
    return this.isSeenStale(seen)
      ? `${level}`
      : level;
  }

  isSeenStale(item: string): boolean {
    if(!item || item === '---'){
      return true;
    }
    const ts = new Date(item);
    if(isNaN(ts.getTime())){
      return true;
    }
    const minutesDiff = (this.date.getTime() - ts.getTime()) / (60 * 1000);
    return minutesDiff >= 60;
  }

  sortDatatable(key: string, type: string){
    this.sortKey.set(key);
    this.sortType.set(type);
  }

  getValueLevel(val: any, good: number, warn: number){
    const v = parseFloat(val);
    if(isNaN(v)){
      return 'gray';
    }
    if(v >= good){
      return 'val-good';
    }
    if(v >= warn){
      return 'val-warn';
    }
    return 'val-bad';
  }

  async refresh(){
    if(this.refreshing()){
      return;
    }
    this.refreshing.set(true);
    try {
      this.sortKey.set('');
      this.sortType.set('');
      this.date = new Date();
      await this.updateData();
    } finally {
      this.refreshing.set(false);
    }
  }

  exportCSV(){
    const headers = ['CODE','STATUS','ALARM','LAST UPDATE (GMT+7)','SITE','LOCATION','CAPACITY (MWp)','POWER (kW)','ENERGY TODAY (kWh)','ENERGY MTD (MWh)','ENERGY YTD (MWh)','PR (%)','AVAI (%)','LOSS (kWh)','YIELD TODAY (kWh/kWp)','YIELD MTD (kWh/kWp)','YIELD YTD (kWh/kWp)','REVENUE TODAY (THB)','REVENUE MTD (THB)','IRR (W/m2)','PVTEMP (C)','AMBTEMP (C)'];
    const keys = ['Id','SEEN','Name','Province','Capacity','POWER','ENERGY','ENERGYMTD','ENERGYYTD','PR','AVAI','LOSS','TD','MTD','YTD','REV_TD','REV_MTD','IRR','PV','AMB'];
    const lines = [headers.join(',')];
    this.filteredData().forEach(row => {
      const cells = keys.map(k => {
        // SEEN เป็น timestamp ต้องแปลงเป็นเวลาไทยก่อนเขียนลงไฟล์
        const value = k === 'SEEN' ? this.dateTimeSrv.toBangkok(row[k]) : row[k];
        return `"${value ?? ''}"`;
      });
      // แทรกสถานะออนไลน์และระดับ alarm ต่อจากคอลัมน์ CODE
      cells.splice(1, 0, `"${this.getOnlineStatus(row.SEEN)}"`, `"${this.getAlarmLevel(row.Id)}"`);
      lines.push(cells.join(','));
    });
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tabular_${this.dateTimeSrv.bangkokFileStamp()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  tranformNumber(val: string){
    if(val == null){
      val = "-1";
    }
    const res = parseFloat(val.replaceAll(",",""));
    if(res >= 0){
      return res;
    } else {
      return -1;
    }
  }

  async getEventSummary(){
    const now = new Date();
    now.setHours(0,0,0,0);
    const request = {
      StartTime: new Date(now).toISOString(),
      EndTime: new Date().toISOString()
    }
    const result = await this.http.getSummaryAlarmEventData(request);
    if(result.length > 0){
      this.eventSummary.set(result);
    } else {
      this.eventSummary.set([]);
    }
  }

  getPlantStatus(pointSource: string){
    const summary = this.eventSummary().find(x => x.PointSource === pointSource);
    const lastseen = this.tableData().find(x => x.Id === pointSource)?.SEEN;
    if(summary){
      if(summary.Major > 0){
        return 'major'; 
      } else if(summary.Minor > 0){
        return 'minor';
      } else if(summary.Warning > 0){
        return 'warning';
      } else if(summary.Info > 0){
        return 'info';
      } else {
        return 'default';
      }
    } else {
      return lastseen && lastseen != '---' ? 'info' : 'default';
    } 
  }

}
