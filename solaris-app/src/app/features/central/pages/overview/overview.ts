import { Component, computed, effect, inject, OnChanges, OnDestroy, OnInit, signal } from '@angular/core';
import { GroupHistorianConfigModel, GroupReatimeConfigModel, HistorianConfig, PageConfigModel, RealtimeConfig, SiteModel } from '../../../../shared/models/config.model';
import { HttpService } from '../../../../shared/services/http.service';
import { Store } from '@ngrx/store';
import { AppInitService } from '../../../../shared/services/app-init.service';
import { Datetime } from '../../../../shared/services/datetime';
import { firstValueFrom, Observable, Subscription, timer } from 'rxjs';
import { NavbarStateModel } from '../../../../shared/models/navigate.model';
import { GroupRequestAtTimeModel, GroupRequestHistorianModel, GroupRequestRealtimeModel, RequestAtTimeModel } from '../../../../shared/models/request.model';
import { DataHistorianModel, DataRealtimeModel, ResponseHistorianModel, ResponseRealtimeModel } from '../../../../shared/models/response.model';
import { ChartService } from '../../../../shared/services/chart.service';
import { SeriesAreaOptions, SeriesColumnOptions, SeriesLineOptions, SeriesOptionsType } from 'highcharts';
import * as OverviewActions from '../../store/actions/overview.action';
import * as OverviewSelectors from '../../store/selectors/overview.selector';
import { getNavState } from '../../../../store/selectors/nav.selectors';
import { getZoneConfig } from '../../../../store/selectors/site.selectors';
import { MapConfigModel } from '../../../../shared/models/svg.model';
import { PlantStatusData } from '../../../../shared/components/piechart/piechart';
import { setDateEnable } from '../../../../store/actions/date.actions';
import { EventSummaryModel } from '../../../../features/sites/models/event.model';
import { getEventSummary } from '../../../../store/selectors/event.selectors';

@Component({
  selector: 'app-overview',
  standalone: false,
  templateUrl: './overview.html',
  styleUrl: './overview.scss'
})
export class Overview implements OnInit, OnDestroy {

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
  eventSummary = signal<EventSummaryModel[]>([]);


  timers?: Subscription;
  navSub?: Subscription;

  private http = inject(HttpService);
  private store = inject(Store);
  private appInit = inject(AppInitService);
  private chartOptions = inject(ChartService);
  private dateTimeSrv = inject(Datetime);
  constructor(){
    // Subscribe to event summary
    this.store.select(getEventSummary).subscribe(data => {
      this.eventSummary.set(data);
    });

    this.navState$ = this.store.select(getNavState);
    this.navSub = this.navState$.subscribe(async (state) => {
      const res = await firstValueFrom(
        this.store.select(getZoneConfig('ALL'))
      );
      if(res && res.siteList){
        this.siteList.set(res.siteList);
      }
    });
  }

  ngOnInit(): void {
    this.initPage();
  }

  ngOnDestroy(): void {
    this.timers?.unsubscribe();
    this.navSub?.unsubscribe();
  }

  async initPage(){
    this.timers?.unsubscribe();

    // Check if data exists in store first
    const hasConfig = await this.loadFromStoreIfExists();
    
    if (!hasConfig) {
      await this.getConfig();
      this.store.dispatch(OverviewActions.loadOverviewConfigTimeStamp({ timestamp: new Date() }));
    }

    //await this.getMapConfig();
    
    this.getRequest();
    await this.getData();
    
    if(this.appInit.config.Timer){
      this.startTimer(this.appInit.config.Timer * 60000);
    }

  }

  private async loadFromStoreIfExists(): Promise<boolean> {
    const state = await firstValueFrom(this.store.select(OverviewSelectors.selectOverviewState));
    let hasData = false;

    if (state.config && state.config.realtimeConfig.length > 0) {
      this.config.set(state.config);
      hasData = true;
    }
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

    return hasData;
  }

  async getConfig() {
    try {
      const config = await this.http.getConfig2(`assets/central/overview/configurations/overview.config.json`);
      if (config) {
        this.config.set(config);
        this.store.dispatch(OverviewActions.loadOverviewConfigSuccess({ config }));
      }
    } catch (error) {
      //console.error('Error fetching config', error);
      this.store.dispatch(OverviewActions.loadOverviewConfigFailure({ error: error as string }));
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
      this.store.dispatch(OverviewActions.loadOverviewRealtimeData({ requests: sortedReq }));
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
      this.store.dispatch(OverviewActions.loadOverviewAtTimeData({ requests: sortedReq }));
    }
  }

  getHistorianRequest(){
    const req: GroupRequestHistorianModel[] = this.config().historianConfig.map((item: GroupHistorianConfigModel) => {
      return {
        Group: item.Group,
        Order: item.Order,
        Request: item.Tags.map((x: HistorianConfig) => {
          return {
            Name: x.Tagname,
            Options: {
              Interval: x.Options.Interval ?? undefined,
              Time: x.Options.Time??'',
              StartTime: x.Options.Time.length > 0 ? '' : this.dateTimeSrv.getTime(x.Options.StartTime),
              EndTime: x.Options.Time.length > 0 ? '' : this.dateTimeSrv.getTime(x.Options.EndTime)
            }
          }
        })
      }
    });
    if(req){
      const sortedReq = req.sort((a,b) => a.Order - b.Order);
      this.requestHistorian.set(sortedReq);
      this.store.dispatch(OverviewActions.loadOverviewHistorianData({ requests: sortedReq }));
    }
  }

  async getData(){
    // Check if data needs to be refreshed based on timestamp
    const shouldRefresh = await this.shouldRefreshData();
    
    // Only fetch data if it doesn't exist or needs refresh
    if (!this.dataRealtime() || Object.keys(this.dataRealtime()).length === 0 || shouldRefresh) {
      await this.getRealtimeData();
      await this.getAtTimeData();
      this.store.dispatch(OverviewActions.loadOverviewConfigTimeStamp({ timestamp: new Date() }))
    }
    //await this.getAtTimeData();
    if (!this.dataHistorian() || Object.keys(this.dataHistorian()).length === 0 || shouldRefresh) {
      await this.getHistorianData();
      this.store.dispatch(OverviewActions.loadOverviewConfigTimeStamp({ timestamp: new Date() }))
    }
  }

  private async shouldRefreshData(): Promise<boolean> {
    const timestamp = await firstValueFrom(this.store.select(OverviewSelectors.selectOverviewTimestamp));
    if (!timestamp) return true;
    const minutesDiff = (Date.now() - new Date(timestamp).getTime()) / 60000;
    return minutesDiff > 2;
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
        this.store.dispatch(OverviewActions.loadOverviewRealtimeDataSuccess({ data: this.dataRealtime() }));
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
              const conf = this.config().realtimeConfig
                .find(x => x.Group == req.Group)?.Tags
                  .find(y => 
                    y.Tagname == data.Name && y.Timestamp && this.dateTimeSrv.getTime(y.Timestamp) === this.dateTimeSrv.getDateTime1(realtimeFornmatValue.TimeStamp)
                );
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
      this.store.dispatch(OverviewActions.loadOverviewRealtimeDataSuccess({ data: this.dataRealtime() }));
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
              const findChartConf = this.config().historianConfig.find(x => x.Group == item.Group)?.Tags.find(y => y.Tagname == response[0]?.Name);
              const start = findChartConf?.Options.StartTime ? this.dateTimeSrv.getTime(findChartConf?.Options.StartTime) : undefined;
              const end = findChartConf?.Options.EndTime ? this.dateTimeSrv.getTime(findChartConf?.Options.EndTime) : undefined;
              newVal[item.Group] = {
                chart: this.chartOptions.getChartOptions(conf.chartOptions.chart),
                title: this.chartOptions.getTitleOptions(conf.chartOptions.title),
                xAxis: this.chartOptions.getXAxisoptions(conf.chartOptions.xAxis, start, end),
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
        this.store.dispatch(OverviewActions.loadOverviewChartDataSuccess({ data: this.dataChart() }));
        this.store.dispatch(OverviewActions.loadOverviewHistorianDataSuccess({ data: this.dataHistorian() }));
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
    await this.getMapConfig();
  }

}
