import { Component, inject, OnChanges, OnDestroy, OnInit, signal } from '@angular/core';
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
import * as TrendActions from '../../store/actions/trend.action';
import * as TrendSelectors from '../../store/selectors/trend.selector';
import { getNavState } from '../../../../store/selectors/nav.selectors';
import { getZoneConfig } from '../../../../store/selectors/site.selectors';
import { MapConfigModel } from '../../../../shared/models/svg.model';
import { PlantStatusData } from '../../../../shared/components/piechart/piechart';
import { getDateState } from '../../../../store/selectors/date.selectors';
import { setDateEnable } from '../../../../store/actions/date.actions';

@Component({
  selector: 'app-trend',
  standalone: false,
  templateUrl: './trend.html',
  styleUrl: './trend.scss'
})
export class Trend implements OnInit, OnDestroy {
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
  mapConfig = signal<MapConfigModel>({} as MapConfigModel);
  
  timers?: Subscription;
  dateStateSubscription?: Subscription;

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
        this.store.select(getZoneConfig(state.location))
      );
      if(res && res.siteList){
        this.siteList.set(res.siteList);
      }
    });
    this.dateState$ = this.store.select(getDateState);
    this.dateStateSubscription = this.dateState$.subscribe(async(state) => {
      const stateDate = state.date.setHours(0,0,0,0);
      const pageDate = this.date.setHours(0,0,0,0);
      if(new Date(pageDate).getTime() != new Date(stateDate).getTime()){
        this.dataChart.set({ ...{} }); // Force new reference
        this.responseHistorian.set([]);
        this.date = new Date(stateDate);
        this.getHistorianRequest();
        await this.getHistorianData();
      }
    });
  }

  ngOnInit(): void {
    this.store.dispatch(setDateEnable({ payload: true }));
    this.initPage();
  }

  ngOnDestroy(): void {
    if(this.timers){
      this.timers.unsubscribe();
    }
    if(this.dateStateSubscription){
      this.dateStateSubscription.unsubscribe();
    }
    this.store.dispatch(setDateEnable({ payload: false }));
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
    
    if(this.appInit.config.Timer){
      this.startTimer(this.appInit.config.Timer * 60000);
    }
  }

  private async loadFromStoreIfExists(): Promise<boolean> {
    return new Promise((resolve) => {
      this.store.select(TrendSelectors.selectTrendState).subscribe(state => {
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
      const config = await this.http.getConfig2(`assets/central/trend/configurations/trend.config.json`);
      if (config) {
        this.config.set(config);
        this.store.dispatch(TrendActions.loadTrendConfigSuccess({ config }));
      }
    } catch (error) {
      console.error('Error fetching config', error);
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
      this.store.dispatch(TrendActions.loadTrendAtTimeData({ requests: sortedReq }));
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
      console.log(this.dataHistorian(), shouldRefresh)
      await this.getHistorianData();
      this.store.dispatch(TrendActions.loadTrendConfigTimeStamp({ timestamp: new Date() }))
    }
  }

  private async shouldRefreshData(): Promise<boolean> {
    return new Promise((resolve) => {
      this.store.select(TrendSelectors.selectTrendTimestamp).subscribe(timestamp => {
        if (!timestamp) {
          resolve(true); // No timestamp means first time, should refresh
          return;
        }
        
        const now = new Date();
        const timeDiff = now.getTime() - new Date(timestamp).getTime();
        const minutesDiff = timeDiff / (1000 * 60); // Convert to minutes
        
        if (minutesDiff > 2) {
          console.log(`Data is ${minutesDiff.toFixed(2)} minutes old, will refresh`);
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
      const result = this.requestAttime().map(async(item) => {
        const request = item.Request;
        const response:ResponseRealtimeModel[] = await this.http.getAtTime(request);
        if(response){
          response.map(data => {
            const conf = this.config().realtimeConfig.find(x => x.Group == item.Group)?.Tags.find(y => y.Tagname == data.Name && y.Timestamp);
            if (conf) {
              this.dataRealtime.update(val => ({
                ...val,
                [conf.Title]: data
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
              console.log(item.Group, series, response);
              
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
        this.store.dispatch(TrendActions.loadTrendChartDataSuccess({ data: this.dataChart() }));
        this.store.dispatch(TrendActions.loadTrendHistorianDataSuccess({ data: this.dataHistorian() }));
      }
    }
  }

  startTimer(dueTimer: number) {
    this.timers = timer(dueTimer, dueTimer).subscribe(x => {
      this.updateData();
    });
  }

  async updateData(){
    await this.getRealtimeData();
    //await this.getAtTimeData();
    await this.getHistorianData();
  }

  async onZoneChanges(event: string){
    this.zoneSelected.update(prev => event);
    console.log(this.zoneSelected())
    await this.getMapConfig();
  }

}
