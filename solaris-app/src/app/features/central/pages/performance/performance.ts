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
import * as PerformanceActions from '../../store/actions/performance.action';
import * as PerformanceSelectors from '../../store/selectors/performance.selector';
import { getNavState } from '../../../../store/selectors/nav.selectors';
import { getZoneConfig } from '../../../../store/selectors/site.selectors';
import { MapConfigModel } from '../../../../shared/models/svg.model';
import { PlantStatusData } from '../../../../shared/components/piechart/piechart';
import { getDateState } from '../../../../store/selectors/date.selectors';
import { setDateEnable } from '../../../../store/actions/date.actions';
import { setLastUpdate } from '../../../../store/actions/last-update.actions';
import { ChartParameters } from '../../../../shared/models/highchart.model';

@Component({
  selector: 'app-performance',
  standalone: false,
  templateUrl: './performance.html',
  styleUrl: './performance.scss'
})
export class Performance implements OnInit, OnDestroy {
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

  energySummary      = computed(() => this.calcSummary('_ENERGY'));
  revenueSummary     = computed(() => this.calcSummary('_REVENUE'));
  yieldSummary       = computed(() => this.calcSummary('_YIELD'));
  insoSummary        = computed(() => this.calcSummary('_INSO'));
  prSummary          = computed(() => this.calcSummary('_PR'));
  availabilitySummary = computed(() => this.calcSummary('_AVAI'));

  sortedEnergySites       = computed(() => this.sortSites('_ENERGY'));
  sortedRevenueSites      = computed(() => this.sortSites('_REVENUE'));
  sortedYieldSites        = computed(() => this.sortSites('_YIELD'));
  sortedInsoSites         = computed(() => this.sortSites('_INSO'));
  sortedPrSites           = computed(() => this.sortSites('_PR'));
  sortedAvailabilitySites = computed(() => this.sortSites('_AVAI'));

  private sortSites(suffix: string): SiteModel[] {
    const data = this.dataRealtime();
    return [...this.siteList()].sort((a, b) => {
      const va = parseFloat(data[a.id + suffix]?.Value?.toString() || '');
      const vb = parseFloat(data[b.id + suffix]?.Value?.toString() || '');
      const aValid = !isNaN(va);
      const bValid = !isNaN(vb);
      if (!aValid && !bValid) return 0;
      if (!aValid) return 1;
      if (!bValid) return -1;
      return vb - va;
    });
  }

  /** หน่วยสำรองรายแถว ใช้เมื่อ tag ไม่ได้ส่ง Unit มา */
  private static readonly UNIT_FALLBACK: Record<string, string> = {
    '_ENERGY': 'kWh',
    '_REVENUE': '฿',
    '_YIELD': 'kWh/kWp',
    '_INSO': 'kWh/m²',
    '_PR': '%',
    '_AVAI': '%'
  };

  private calcSummary(suffix: string) {
    const sites = this.siteList();
    const data  = this.dataRealtime();
    if (!sites.length || !Object.keys(data).length) return null;
    const values = sites
      .map(s => parseFloat(data[s.id + suffix]?.Value?.toString() || ''))
      .filter(v => !isNaN(v));
    if (!values.length) return null;
    const unitFromTag = sites
      .map(s => data[s.id + suffix]?.Unit)
      .find(u => !!u);
    return {
      avg:  values.reduce((a, b) => a + b, 0) / values.length,
      min:  Math.min(...values),
      max:  Math.max(...values),
      unit: unitFromTag || Performance.UNIT_FALLBACK[suffix] || ''
    };
  }

  /** หน่วยสำหรับหัวการ์ด — อ่านจาก tag ก่อน ถ้าไม่มีใช้ค่าสำรอง */
  unitOf(suffix: string): string {
    const data = this.dataRealtime();
    const unitFromTag = this.siteList()
      .map(s => data[s.id + suffix]?.Unit)
      .find(u => !!u);
    return unitFromTag || Performance.UNIT_FALLBACK[suffix] || '';
  }

  /** ทศนิยมที่เหมาะกับแต่ละแถว — ค่าเงิน/พลังงานไม่ต้องมีทศนิยม ส่วน % และ yield เอา 1-2 ตำแหน่ง */
  private static readonly DECIMALS: Record<string, number> = {
    '_ENERGY': 0, '_REVENUE': 0, '_YIELD': 2, '_INSO': 2, '_PR': 1, '_AVAI': 1
  };

  energyChart       = computed(() => this.buildChart('_ENERGY', 0));
  revenueChart      = computed(() => this.buildChart('_REVENUE', 1));
  yieldChart        = computed(() => this.buildChart('_YIELD', 2));
  insoChart         = computed(() => this.buildChart('_INSO', 3));
  prChart           = computed(() => this.buildChart('_PR', 4));
  availabilityChart = computed(() => this.buildChart('_AVAI', 5));

  /**
   * กราฟแท่งเทียบรายไซต์ของหนึ่งตัวชี้วัด เรียงมากไปน้อย
   * @param suffix ท้าย tag เช่น '_ENERGY'
   * @param cardIndex ลำดับใน cardProperty ใช้เอาสีประจำแถว
   */
  private buildChart(suffix: string, cardIndex: number): ChartParameters {
    const data = this.dataRealtime();
    const conf = this.cardProperty()[cardIndex];
    const color = conf?.activeColor || 'var(--active-txt)';
    const unit = this.unitOf(suffix);
    const decimals = Performance.DECIMALS[suffix] ?? 1;

    const items = this.sortSites(suffix).map(site => {
      const raw = parseFloat(data[site.id + suffix]?.Value?.toString().replaceAll(',', '') ?? '');
      return { id: site.id, value: isNaN(raw) ? 0 : raw };
    });

    return {
      chart: this.chartOptions.getChartOptions({ margin: [14, 10, 34, 52] }),
      title: { text: undefined } as any,
      xAxis: {
        categories: items.map(i => i.id),
        lineColor: 'var(--chart-brd)',
        tickColor: 'var(--chart-brd)',
        labels: {
          style: { color: 'var(--chart-txt)', fontSize: '10px' },
          rotation: items.length > 12 ? -45 : 0
        }
      } as any,
      yAxis: [{
        title: { text: null },
        gridLineColor: 'var(--chart-brd)',
        labels: { style: { color: 'var(--chart-txt)', fontSize: '10px' } },
        tickAmount: 4,
        min: 0
      }] as any,
      legend: { enabled: false } as any,
      tooltip: {
        shared: false,
        backgroundColor: 'var(--chart-tlp)',
        borderWidth: 0,
        style: { color: 'var(--primary-txt)', fontSize: '11px' },
        valueSuffix: unit ? ` ${unit}` : '',
        valueDecimals: decimals
      } as any,
      plotOptions: {
        column: { borderRadius: 2, pointPadding: 0.06, groupPadding: 0.1, borderWidth: 0 },
        series: { animation: false }
      } as any,
      series: [{
        type: 'column',
        name: suffix.replace('_', ''),
        color,
        data: items.map(i => i.value)
      }] as any
    };
  }
  
  timers?: Subscription;
  dateStateSubscription?: Subscription;
  storeSub?: Subscription;
  storeSub2?: Subscription;

  date: Date = new Date();

  private http = inject(HttpService);
  private store = inject(Store);
  private appInit = inject(AppInitService);
  private chartOptions = inject(ChartService);
  private dateTimeSrv = inject(Datetime);
  constructor(){
    this.navState$ = this.store.select(getNavState);
    this.navState$.subscribe(async (state) => {
      const res = await firstValueFrom(
        this.store.select(getZoneConfig('ALL'))
      );
      if(res && res.siteList){
        this.siteList.set(res.siteList);
      }
    });
    this.dateState$ = this.store.select(getDateState);
    this.dateStateSubscription = this.dateState$.subscribe(async(state) => {
      this.timers?.unsubscribe();
      const stateDate = state.date.setHours(0,0,0,0);
      const pageDate = new Date().setHours(0,0,0,0);
      this.dataRealtime.set({});
      this.dataRealtime.update(val => ({}));
      if(new Date(pageDate).getTime() != new Date(stateDate).getTime()){
        this.date = state.date;
        await this.getConfig();
        await this.getCardConfig();
        this.getAttimeRequest2();
        await this.getAtTimeData();
      } else {
        this.date = state.date;
        const oldData = await firstValueFrom(
          this.store.select(PerformanceSelectors.selectPerformanceAtTimeRequests)
        );
        if(oldData.filter(x => x.Request.length > 0).length > 0){
          this.store.dispatch(PerformanceActions.resetPerformanceState())
        }
        await this.initPage();
      };
    });
  }

  ngOnInit(): void {
    this.store.dispatch(setDateEnable({ payload: true }));
    //this.initPage();
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
      this.store.dispatch(PerformanceActions.loadPerformanceConfigTimeStamp({ timestamp: new Date() }));
    }

    await this.getCardConfig();
    
    this.getRequest();
    await this.getData();
    
    if(this.appInit.config.Timer){
      this.startTimer(this.appInit.config.Timer * 60000);
    }
  }

  private async loadFromStoreIfExists(): Promise<boolean> {
    return new Promise((resolve) => {
      this.storeSub = this.store.select(PerformanceSelectors.selectPerformanceState).subscribe(state => {
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
      const path = this.date.getDate() === new Date().getDate() ? 
        `assets/central/performance/configurations/performance.config.json` :
        `assets/central/performance/configurations/performance2.config.json` ;
      const config = await this.http.getConfig2(path);
      if (config) {
        this.config.set(config);
        this.store.dispatch(PerformanceActions.loadPerformanceConfigSuccess({ config }));
      }
    } catch (error) {
      //console.error('Error fetching config', error);
      this.store.dispatch(PerformanceActions.loadPerformanceConfigFailure({ error: error as string }));
    }
  }

  async getCardConfig(){
    const config = await this.http.getConfig2(`assets/central/performance/property/property.config.json`);
    if (config) {
      this.cardProperty.set(config);
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
      this.store.dispatch(PerformanceActions.loadPerformanceRealtimeData({ requests: sortedReq }));
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
      this.store.dispatch(PerformanceActions.loadPerformanceAtTimeData({ requests: sortedReq }));
    }
  }

  getAttimeRequest2(){
    //const ts = this.date.setHours(23,0,0);
    const req: GroupRequestAtTimeModel[] = this.config().realtimeConfig.map((item: GroupReatimeConfigModel) => {
      const rq: RequestAtTimeModel[] = item.Tags.filter(x => x.Timestamp).reduce((acc, cur) => {
        const ts = this.dateTimeSrv.getTime(cur.Timestamp || '', this.date);
        const eod = new Date(ts).setHours(23, 0, 0);
        if(acc.findIndex(x => x.TimeStamp === ts) < 0){
          acc.push({
            Tags: item.Tags.filter(x => x.Timestamp && x.Timestamp == cur.Timestamp).map(y => y.Tagname),
            TimeStamp: ts
          })
        }
        return acc;
      }, [] as RequestAtTimeModel[] );
      
      return {
        Group: item.Group,
        Order: item.Order,
        Request: rq
      }
    });
    if(req){
      const sortedReq = req.sort((a,b) => a.Order - b.Order);
      this.requestAttime.set(sortedReq);
      this.store.dispatch(PerformanceActions.loadPerformanceAtTimeData({ requests: sortedReq }));
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
      this.store.dispatch(PerformanceActions.loadPerformanceHistorianData({ requests: sortedReq }));
    }
  }

  async getData(){
    // Check if data needs to be refreshed based on timestamp
    const shouldRefresh = await this.shouldRefreshData();
    
    // Only fetch data if it doesn't exist or needs refresh
    if (!this.dataRealtime() || Object.keys(this.dataRealtime()).length === 0 || shouldRefresh) {
      await this.getRealtimeData();
      this.store.dispatch(PerformanceActions.loadPerformanceConfigTimeStamp({ timestamp: new Date() }))
    }
    //await this.getAtTimeData();
    if (!this.dataHistorian() || Object.keys(this.dataHistorian()).length === 0 || shouldRefresh) {
      await this.getHistorianData();
      this.store.dispatch(PerformanceActions.loadPerformanceConfigTimeStamp({ timestamp: new Date() }))
    }
  }

  private async shouldRefreshData(): Promise<boolean> {
    return new Promise((resolve) => {
      this.storeSub2 = this.store.select(PerformanceSelectors.selectPerformanceTimestamp).subscribe(timestamp => {
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
        this.store.dispatch(PerformanceActions.loadPerformanceRealtimeDataSuccess({ data: this.dataRealtime() }));
      }
    }
  }

  async getAtTimeData(){
    if (this.requestAttime() && this.requestAttime().length > 0) {
      const selectedDay = new Date(this.date).setHours(0,0,0,0);
      for await (const req of this.requestAttime()) {
        const result = req.Request.map(async(item) => {
          const request = item;
          const response:ResponseHistorianModel[] = await this.http.getAtTime([request]);
          if(response){
            response.map(data => {
              // getattime API คืนค่าล่าสุดก่อนเวลาที่ขอถ้าไม่มีข้อมูลตรงวัน ต้องเช็ควันที่ของ record เอง ไม่งั้นค่าเก่าจะโผล่มาแทนที่จะเป็น 0
              const record = data.records && data.records.length > 0 ? data.records[0] : null;
              const isSameDay = !!record && new Date(record.TimeStamp).setHours(0,0,0,0) === selectedDay;
              const conf = this.config().realtimeConfig.find(x => x.Group == req.Group)?.Tags.find(y => y.Tagname == data.Name);
              if (conf) {
                const datas: ResponseRealtimeModel = {
                  Name: data.Name,
                  Min: data.Min,
                  Max: data.Max,
                  Unit: data.Unit,
                  Value: isSameDay ? parseFloat(record!.Value) : 0,
                  TimeStamp: isSameDay ? record!.TimeStamp : '',
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
                    Value: isSameDay ? parseFloat(record!.Value) : 0,
                    TimeStamp: isSameDay ? record!.TimeStamp : '',
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
      this.store.dispatch(PerformanceActions.loadPerformanceRealtimeDataSuccess({ data: this.dataRealtime() }));
    }
  }

  async getHistorianData(){
    if (this.requestHistorian() && this.requestHistorian().length > 0) {
      const result = this.requestHistorian().map(async(item) => {
        const request = item.Request;
        const response:ResponseHistorianModel[] = await this.http.getHistorian(request);
        if(response){
          // สร้าง object ใหม่แทนการ update
          this.dataChart.update(val => {
            // Clone object เดิมก่อน
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
              
              // สร้าง chart config object ใหม่
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
        this.store.dispatch(PerformanceActions.loadPerformanceChartDataSuccess({ data: this.dataChart() }));
        this.store.dispatch(PerformanceActions.loadPerformanceHistorianDataSuccess({ data: this.dataHistorian() }));
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
  }

}
