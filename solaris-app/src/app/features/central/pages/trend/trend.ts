import { Component, inject, OnChanges, OnDestroy, OnInit, signal } from '@angular/core';
import { GroupHistorianConfigModel, GroupReatimeConfigModel, HistorianConfig, PageConfigModel, RealtimeConfig, SiteModel } from '../../../../shared/models/config.model';
import { HttpService } from '../../../../shared/services/http.service';
import { Store } from '@ngrx/store';
import { AppInitService } from '../../../../shared/services/app-init.service';
import { Datetime } from '../../../../shared/services/datetime';
import { firstValueFrom, Observable, Subscription, take, timer } from 'rxjs';
import { NavbarStateModel } from '../../../../shared/models/navigate.model';
import { GroupRequestAtTimeModel, GroupRequestHistorianModel, GroupRequestRealtimeModel, RequestAtTimeModel } from '../../../../shared/models/request.model';
import { DataHistorianModel, DataRealtimeModel, ResponseHistorianModel, ResponseRealtimeModel } from '../../../../shared/models/response.model';
import { ChartService } from '../../../../shared/services/chart.service';
import { SeriesAreaOptions, SeriesColumnOptions, SeriesLineOptions, SeriesOptionsType } from 'highcharts';
import * as TrendActions from '../../store/actions/trend.action';
import * as TrendSelectors from '../../store/selectors/trend.selector';
import { getNavState } from '../../../../store/selectors/nav.selectors';
import { getZoneConfig } from '../../../../store/selectors/site.selectors';
import { MapConfigModel } from '../../../../shared/models/svg.model';
import { PlantStatusData } from '../../../../shared/components/piechart/piechart';
import { setDate, setDateEnable } from '../../../../store/actions/date.actions';
import { ChartPickerModel } from '../../../../shared/components/chart-card/chart-card';
import { PageStateModel } from '../../../../shared/models/state.model';
import { setLastUpdate } from '../../../../store/actions/last-update.actions';

@Component({
  selector: 'app-trend',
  standalone: false,
  templateUrl: './trend.html',
  styleUrl: './trend.scss'
})
export class Trend implements OnInit, OnDestroy {
  navState$: Observable<NavbarStateModel>;

  config = signal<PageConfigModel>({
    realtimeConfig: [],
    historianConfig: [],
    chartConfig: []
  });
  configs: any = {};

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
  mapConfig = signal<MapConfigModel>({} as MapConfigModel);
  
  timers?: Subscription;
  storeSub?: Subscription;
  storeSub2?: Subscription;

  date: Date = new Date();

  /** โหมดช่วงเวลาของทั้งหน้า เลือกจากแถบด้านบน */
  mode = signal<'d' | 'w' | 'm' | 'y'>('d');
  /** ช่วงเวลาจริงที่ใช้ยิง historian คำนวณจาก date + mode */
  rangeStart: Date = new Date(new Date().setHours(0,0,0,0));
  rangeEnd: Date = new Date(new Date().setHours(23,59,59,0));

  isLoading = signal<boolean>(false);
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
    // หน้านี้มีตัวเลือกวันของตัวเองด้านบน จึงไม่ใช้ตัวเลือกวันบน navbar
    this.store.dispatch(setDateEnable({ payload: false }));
    this.applyRange(false);
    this.initPage();
  }

  ngOnInit(): void {
  }

  /** ช่วง default ของหน้า = โหมดรายวันของวันนี้ ใช้ตัดสินว่าจะเปิด auto-refresh หรือไม่ */
  get isDefaultRange(): boolean {
    if(this.mode() !== 'd'){
      return false;
    }
    const today = new Date();
    return this.date.getFullYear() === today.getFullYear()
        && this.date.getMonth() === today.getMonth()
        && this.date.getDate() === today.getDate();
  }

  /** คำนวณ rangeStart / rangeEnd จาก date + mode ปัจจุบัน */
  private applyRange(reload: boolean = true){
    const res = this.calcRange();
    this.rangeStart = res.start;
    this.rangeEnd = res.end;
    // sync วันที่กับ store เพื่อให้หน้าอื่นที่ใช้วันร่วมกันยังตรงกัน
    this.store.dispatch(setDate({ payload: new Date(this.rangeStart) }));
    if(reload){
      this.reloadRange();
    }
  }

  private calcRange(): { start: Date; end: Date } {
    const res: ChartPickerModel = {
      name: 'TREND',
      start: new Date(),
      end: new Date(),
      mode: this.mode()
    };
    switch(this.mode()){
      case 'w': {
        const startDt = new Date(this.date);
        const endDt = new Date(this.date);
        const first = startDt.getDay();
        res.start = new Date(new Date(startDt.setDate(startDt.getDate() - first)).setHours(0,0,0,0));
        res.end = new Date(new Date(endDt.setDate(endDt.getDate() - (first - 6))).setHours(23,59,59,0));
        break;
      }
      case 'm': {
        const dt = new Date(new Date(this.date).setHours(0,0,0,0));
        res.start = new Date(new Date(dt).setDate(1));
        const next = new Date(new Date(res.start).setMonth(res.start.getMonth() + 1, 1));
        res.end = new Date(new Date(new Date(next).setDate(0)).setHours(23,59,59,0));
        break;
      }
      case 'y': {
        const dt = new Date(new Date(this.date).setHours(0,0,0,0));
        res.start = new Date(new Date(dt).setMonth(0, 1));
        res.end = new Date(new Date(new Date(dt).setMonth(11, 31)).setHours(23,59,59,0));
        break;
      }
      default: {
        const dt = new Date(this.date);
        res.start = new Date(new Date(dt).setHours(0,0,0,0));
        res.end = new Date(new Date(dt).setHours(23,59,59,0));
        break;
      }
    }
    return { start: res.start, end: res.end };
  }

  /** ความละเอียดข้อมูล (นาที) ของแต่ละโหมด ยิ่งช่วงยาวยิ่งต้องหยาบ ไม่งั้นจุดเยอะจนกราฟช้า */
  private intervalOfMode(): number | undefined {
    switch(this.mode()){
      case 'w': return 15;
      case 'm': return 60;
      case 'y': return 1440;
      default: return undefined;   // รายวันใช้ค่าจาก config เดิม
    }
  }

  /** เลือกวันจากตัวเลือกวันที่หัวหน้าเพจ */
  onDateSelect(event: Date){
    this.date = new Date(event);
    this.applyRange();
  }

  /** สลับโหมดช่วงเวลา DAY / WEEK / MONTH / YEAR */
  setTimeRange(range: 'd' | 'w' | 'm' | 'y'){
    if(this.mode() === range){
      return;
    }
    this.mode.set(range);
    this.applyRange();
  }

  /** โหลดข้อมูลใหม่ตามช่วงเวลาที่เลือก */
  private async reloadRange(){
    this.timers?.unsubscribe();
    await this.getConfig();
    this.getHistorianRequest();
    await this.getHistorianData();
    // เปิด auto-refresh เฉพาะตอนดูช่วง default เท่านั้น กันรีเฟรชทับข้อมูลย้อนหลังที่ผู้ใช้เลือกเอง
    if(this.isDefaultRange && this.appInit.config.Timer){
      this.startTimer(this.appInit.config.Timer * 60000);
    }
  }

  ngOnDestroy(): void {
    if(this.timers){
      this.timers.unsubscribe();
    }
  }

  async initPage(){
    this.timers?.unsubscribe();

    // Check if data exists in store first
    const hasConfig = await this.loadFromStoreIfExists();
    
    if (!hasConfig) {
      await this.getConfig();
      this.store.dispatch(TrendActions.loadTrendConfigTimeStamp({ timestamp: new Date() }));
    }
    
    this.getRequest();
    await this.getData();
    
    if(this.isDefaultRange && this.appInit.config.Timer){
      this.startTimer(this.appInit.config.Timer * 60000);
    }
  }


  private async loadFromStoreIfExists(): Promise<boolean> {
    return new Promise((resolve) => {
      this.storeSub = this.store.select(TrendSelectors.selectTrendState)
        .pipe(take(1)) // เพิ่มบรรทัดนี้
        .subscribe((state: PageStateModel) => {
          
          let hasData = false;
          // Check if config exists and load it
        if (state.config && state.config.historianConfig.length > 0) {
          this.config.update(prev => state.config);
          hasData = true;
        }
        
        // Check if requests exist and load them
        if (state.req_realtime && state.req_realtime.length > 0) {
          this.requestRealtime.update(prev => state.req_realtime);
          hasData = true;
        }
        
        if (state.req_attime && state.req_attime.length > 0) {
          this.requestAttime.update(prev => state.req_attime);
          hasData = true;
        }
        
        if (state.req_historian && state.req_historian.length > 0) {
          this.requestHistorian.update(prev => state.req_historian);
          hasData = true;
        }
        
        // Check if data exists and load it
        if (state.data_realtime && Object.keys(state.data_realtime).length > 0) {
          this.dataRealtime.update(prev => state.data_realtime);
          hasData = true;
        }
        
        if (state.data_historian && Object.keys(state.data_historian).length > 0) {
          this.dataHistorian.update(prev => state.data_historian);
          hasData = true;
        }
        
        if (state.data_chart && Object.keys(state.data_chart).length > 0) {
          this.dataChart.update(prev => JSON.parse(JSON.stringify(state.data_chart)));
          hasData = true;
        }
          resolve(hasData);
        });
    });
  }

  async getConfig() {
    try {
      const path = this.isDefaultRange ?
        `assets/central/trend/configurations/trend.config.json` :
        `assets/central/trend/configurations/trend2.config.json` ;
      const config = await this.http.getConfig2(path);
      if (config) {
        this.config.set(config);
        this.store.dispatch(TrendActions.loadTrendConfigSuccess({ config }));
      }
    } catch (error) {
      //console.error('Error fetching config', error);
      this.store.dispatch(TrendActions.loadTrendConfigFailure({ error: error as string }));
    }
  }

  async getMapConfig(){
    const config = await this.http.getConfig2(`assets/svg/${this.zoneSelected()}.config.json`);
    if (config) {
      this.mapConfig.set(config);
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
      this.store.dispatch(TrendActions.loadTrendRealtimeData({ requests: sortedReq }));
    }
  }

  getAttimeRequest(){
    const req: GroupRequestAtTimeModel[] = this.config().realtimeConfig.map((item: GroupReatimeConfigModel) => {
      return {
        Group: item.Group,
        Order: item.Order,
        Request: item.Tags.filter(x => x.Timestamp).reduce((acc: RequestAtTimeModel[], cur: RealtimeConfig) => {
          const timestamp = cur.Timestamp ? this.dateTimeSrv.getTime(cur.Timestamp, this.attimeAnchor()) : null;
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
      this.store.dispatch(TrendActions.loadTrendAtTimeData({ requests: sortedReq }));
    }
  }

  getHistorianRequest(){
    const req: GroupRequestHistorianModel[] = this.config().historianConfig.map((item: GroupHistorianConfigModel) => {
      const start = new Date(this.rangeStart);
      const end = new Date(this.rangeEnd);
      const interval = this.intervalOfMode();
      return {
        Group: item.Group,
        Order: item.Order,
        Request: item.Tags.map((x: HistorianConfig) => {
          return {
            Name: x.Tagname,
            Options: {
              // โหมดที่ไม่ใช่รายวันต้องบอก type ให้ backend รู้ว่าเป็นการ plot ตาม interval
              Type: interval ? 'plot' : undefined,
              Interval: interval ?? x.Options.Interval ?? undefined,
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
      this.store.dispatch(TrendActions.loadTrendHistorianData({ requests: sortedReq }));
    }
  }

  async getData(){
    // Check if data needs to be refreshed based on timestamp
    const shouldRefresh = await this.shouldRefreshData();
    
    // Only fetch data if it doesn't exist or needs refresh
    if (!this.dataRealtime() || Object.keys(this.dataRealtime()).length === 0 || shouldRefresh) {
      await this.getRealtimeData();
      this.store.dispatch(TrendActions.loadTrendConfigTimeStamp({ timestamp: new Date() }))
    }
    //await this.getAtTimeData();
    if (!this.dataHistorian() || Object.keys(this.dataHistorian()).length === 0 || shouldRefresh) {
      await this.getHistorianData();
      this.store.dispatch(TrendActions.loadTrendConfigTimeStamp({ timestamp: new Date() }))
    }
  }

  private async shouldRefreshData(): Promise<boolean> {
    return new Promise((resolve) => {
      this.storeSub2 = this.store.select(TrendSelectors.selectTrendTimestamp).subscribe(timestamp => {
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
        this.store.dispatch(TrendActions.loadTrendRealtimeDataSuccess({ data: this.dataRealtime() }));
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
              const realtimeFornmatValue = {
                Max: data.Max,
                Min: data.Min,
                Name: data.Name,
                TimeStamp: data.records.length > 0 ? data.records[0].TimeStamp : '',
                Unit: data.Unit,
                Value: data.records.length > 0 ? parseFloat(data.records[0].Value.toString().replaceAll(',', '')) : null
              };
              const conf = this.config().realtimeConfig.find(x => x.Group == req.Group)?.Tags.find(y => y.Tagname == data.Name && y.Timestamp);
              if (conf) {
                this.dataRealtime.update(val => ({
                  ...val,
                  [conf.Title]: realtimeFornmatValue
                }));
              }
              this.responseRealtime.update(val => [...val, realtimeFornmatValue]);
            });
          }
          return response;
        });
        const res = await Promise.allSettled(result);
      }
      this.store.dispatch(TrendActions.loadTrendRealtimeDataSuccess({ data: this.dataRealtime() }));
    }
  }

  async getHistorianData(){
    if (this.requestHistorian() && this.requestHistorian().length > 0) {
      this.isLoading.set(true);
      this.getAttimeRequest();
      await this.getAtTimeData();
      const result = this.requestHistorian().map(async(item) => {
        const request = item.Request;
        // โหมดรายวันใช้ endpoint เดิม ส่วนโหมดอื่นต้องใช้ getdata เพื่อให้ Type/Interval มีผลจริง
        const response:ResponseHistorianModel[] = this.intervalOfMode()
          ? await this.http.getAllHistorianData(request)
          : await this.http.getHistorian(request);
        if(response){
          // สร้าง object ใหม่แทนการ update
          this.dataChart.update(val => {
            // Clone object เดิมก่อน
            const newVal = { ...val };
            
            let conf = this.config().chartConfig.find(x => x.name == item.Group);

            //console.log('chart config', item.Group, conf);
            let series: SeriesOptionsType[] | SeriesLineOptions[] | SeriesAreaOptions[] | SeriesColumnOptions[] = []; 
            if(conf){
              conf.tags.forEach((x, index) => {                 
                let data = response.find(d => d.Name == x.name);
                if(data && data.records){
                  let res = this.chartOptions.getSeriesOptions(x.title, x.options, data);
                  series.push(res);
                }
              })
              let xAxisOptions = this.chartOptions.getXAxisoptions({});
              if(request && request.length > 0 && request[0].Options?.StartTime){
                xAxisOptions.min = new Date(request[0].Options.StartTime).getTime()+(7*60*60*1000);
                xAxisOptions.max = new Date(request[0].Options.EndTime).getTime()+(7*60*60*1000);
              }
              xAxisOptions = this.applyAxisMode(xAxisOptions);
              // สร้าง chart config object ใหม่
              //console.log('chart config', conf.chartOptions.legend);
              newVal[item.Group] = {
                chart: this.chartOptions.getChartOptions(conf.chartOptions.chart),
                title: this.chartOptions.getTitleOptions(conf.chartOptions.title),
                xAxis: xAxisOptions,
                yAxis: this.chartOptions.getYAxisoptions(conf.chartOptions.yAxis),
                legend: this.chartOptions.getLegendOptions(conf.chartOptions.legend),
                plotOptions: this.chartOptions.getPlotOptions(conf.chartOptions.plotOptions),
                series: [...series] // Clone array
              };
            }
            // Return object ใหม่ทั้งหมด
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
        this.store.dispatch(TrendActions.loadTrendChartDataSuccess({ data: this.dataChart() }));
        this.store.dispatch(TrendActions.loadTrendHistorianDataSuccess({ data: this.dataHistorian() }));
      }
      this.isLoading.set(false);
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
  }

  async onZoneChanges(event: string){
    this.zoneSelected.update(prev => event);
    await this.getMapConfig();
  }

  /** วันอ้างอิงของค่า at-time (สรุป ENERGY/PR) = วันสุดท้ายของช่วง แต่ไม่เกินวันนี้ */
  private attimeAnchor(): Date {
    const today = new Date();
    const end = new Date(this.rangeEnd);
    return end.getTime() > today.getTime() ? today : end;
  }

  /** ปรับระยะ tick และรูปแบบ label ของแกนเวลาให้เหมาะกับโหมดที่เลือก */
  private applyAxisMode(xAxis: any): any {
    if(!xAxis || xAxis.categories){
      return xAxis;
    }
    const preset: Record<string, { tickInterval: number; format: string }> = {
      d: { tickInterval: 7200000,    format: '{value:%H}' },
      w: { tickInterval: 86400000,   format: '{value:%a}' },
      m: { tickInterval: 604800000,  format: '{value:%d}' },
      y: { tickInterval: 2678400000, format: '{value:%b}' }
    };
    const conf = preset[this.mode()] ?? preset['d'];
    return {
      ...xAxis,
      tickInterval: conf.tickInterval,
      labels: { ...(xAxis.labels ?? {}), format: conf.format }
    };
  }

  /** กราฟถือว่ามีข้อมูลก็ต่อเมื่อมีอย่างน้อย 1 จุดที่ไม่ใช่ null/undefined */
  hasChartData(chart: any): boolean {
    const series = chart?.series;
    if(!Array.isArray(series) || series.length === 0){
      return false;
    }
    return series.some((s: any) => {
      const points = s?.data;
      if(!Array.isArray(points) || points.length === 0){
        return false;
      }
      return points.some((p: any) => {
        if(p === null || p === undefined){
          return false;
        }
        // จุดข้อมูลอาจเป็น [x, y] หรือ { y: ... } หรือค่าตัวเลขตรงๆ
        if(Array.isArray(p)){
          return p[1] !== null && p[1] !== undefined;
        }
        if(typeof p === 'object'){
          return p.y !== null && p.y !== undefined;
        }
        return true;
      });
    });
  }

}
