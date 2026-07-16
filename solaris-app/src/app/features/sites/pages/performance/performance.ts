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
import * as EfficiencyActions from '../../store/actions/performance.action';
import * as EfficiencySelectors from '../../store/selectors/performance.selector';
import { getNavState } from '../../../../store/selectors/nav.selectors';
import { getZoneConfig } from '../../../../store/selectors/site.selectors';
import { MapConfigModel } from '../../../../shared/models/svg.model';
import { PlantStatusData } from '../../../../shared/components/piechart/piechart';
import { setDateEnable } from '../../../../store/actions/date.actions';
import { ColorRangeModel, PanelConfigModel } from '../../../../shared/models/panel.model';
import { ChartPickerModel } from '../../../../shared/components/chart-card/chart-card';


@Component({
  selector: 'app-performance',
  standalone: false,
  templateUrl: './performance.html',
  styleUrl: './performance.scss'
})
export class Performance implements OnInit, OnDestroy {

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
  siteSelected = signal<string>('');

  panelList = signal<PanelConfigModel[]>([]);
  colorRange = signal<ColorRangeModel[]>([]);
  cardProperty = signal<any[]>([]);

  inverterList = computed(() => {
    if(!this.config() || this.config().realtimeConfig.length < 1){
      return [];
    }  else {
      const findInv = this.config().realtimeConfig.find(x => x.Group.toLowerCase() === 'inverter');
      return findInv ? findInv.Tags.map(x => x.Title.split('_')[0].toUpperCase()) : [];
    }
  })

  loadingChart = signal<string>('');
  zoneSelected = signal<string>('overall');
  mapConfig = signal<MapConfigModel>({} as MapConfigModel);
  plantStatusData = signal<PlantStatusData[]>([
    { label: 'INV NORMAL', count: 60, percentage: 60, color: '#10FDD3', unit: 'unit' },
    { label: 'INV ERROR', count: 25, percentage: 25, color: '#DEB266', unit: 'unit' },
    { label: 'INV FCOM', count: 15, percentage: 15, color: '#FF4F52', unit: 'unit' }
  ]);

  timers?: Subscription;
  navSub?: Subscription;
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
    //this.initPage();
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
    this.config.set({
      realtimeConfig: [],
      historianConfig: [],
      chartConfig: []
    });
    this.requestRealtime.set([]);
    this.requestAttime.set([]);
    this.requestHistorian.set([]);
    this.responseRealtime.set([]);
    this.responseHistorian.set([]);
    this.dataChart.set({});
    this.dataRealtime.set({});
    this.dataHistorian.set({});
    this.panelList.set([]);
    this.colorRange.set([]);
    //this.plantStatusData.set([]);
    //this.store.dispatch(EfficiencyActions.resetEfficiencyState());
  }

  async initPage(){
    this.timers?.unsubscribe();

    // Check if data exists in store first
    const hasConfig = await this.loadFromStoreIfExists();
    
    if (!hasConfig) {
      await this.getConfig();
      this.store.dispatch(EfficiencyActions.loadEfficiencyConfigTimeStamp({ timestamp: new Date() }));
    }

    this.getRequest();
    await this.getData();
    
    if(this.appInit.config.Timer){
      this.startTimer(this.appInit.config.Timer * 60000);
    }

  }

  private async loadFromStoreIfExists(): Promise<boolean> {
    return new Promise((resolve) => {
      this.storeSub = this.store.select(EfficiencySelectors.selectEfficiencyState).subscribe(state => {
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
      const config = await this.http.getConfig2(`assets/site/performance/configurations/performance[${this.siteSelected()}].config.json`);
      if (config) {
        this.config.set(config);
        this.store.dispatch(EfficiencyActions.loadEfficiencyConfigSuccess({ config }));
      }
    } catch (error) {
      //console.error('Error fetching config', error);
      this.store.dispatch(EfficiencyActions.loadEfficiencyConfigFailure({ error: error as string }));
    }
  }

  async getCardConfig(){
    const config = await this.http.getConfig2(`assets/site/performance/property/property[${this.siteSelected()}].config.json`);
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
      this.store.dispatch(EfficiencyActions.loadEfficiencyRealtimeData({ requests: sortedReq }));
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
      this.store.dispatch(EfficiencyActions.loadEfficiencyAtTimeData({ requests: sortedReq }));
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
      this.store.dispatch(EfficiencyActions.loadEfficiencyHistorianData({ requests: sortedReq }));
    }
  }

  async getData(){
    // Check if data needs to be refreshed based on timestamp
    const shouldRefresh = await this.shouldRefreshData();
    
    // Only fetch data if it doesn't exist or needs refresh
    if (!this.dataRealtime() || Object.keys(this.dataRealtime()).length === 0 || shouldRefresh) {
      await this.getRealtimeData();
      this.store.dispatch(EfficiencyActions.loadEfficiencyConfigTimeStamp({ timestamp: new Date() }))
    }
    //await this.getAtTimeData();
    if (!this.dataHistorian() || Object.keys(this.dataHistorian()).length === 0 || shouldRefresh) {
      await this.getHistorianData();
      this.store.dispatch(EfficiencyActions.loadEfficiencyConfigTimeStamp({ timestamp: new Date() }))
    }
  }

  private async shouldRefreshData(): Promise<boolean> {
    return new Promise((resolve) => {
      this.storeSub2 = this.store.select(EfficiencySelectors.selectEfficiencyTimestamp).subscribe(timestamp => {
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
        this.store.dispatch(EfficiencyActions.loadEfficiencyRealtimeDataSuccess({ data: this.dataRealtime() }));
      }
    }
  }

  async getAtTimeData(){
    if (this.requestAttime() && this.requestAttime().length > 0) {
      for await (const req of this.requestAttime()) {
        const result = req.Request.map(async(item) => {
          const request = item;
          const response:ResponseRealtimeModel[] = await this.http.getAtTime([request]);
          if(response){
            response.map(data => {
              const conf = this.config().realtimeConfig.find(x => x.Group == req.Group)?.Tags.find(y => y.Tagname == data.Name && y.Timestamp);
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
      }
      this.store.dispatch(EfficiencyActions.loadEfficiencyRealtimeDataSuccess({ data: this.dataRealtime() }));
      
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
            let series: SeriesOptionsType[] | SeriesLineOptions[] | SeriesAreaOptions[] | SeriesColumnOptions[] | any[] = []; 
            if(conf){
              if(conf?.chartOptions?.xAxis?.categories){
                const categorie = conf?.chartOptions?.xAxis?.categories || [];
                let serie = {
                  type: 'column',
                  name: '',
                  data: categorie.map((x: any) => {
                    const tag = this.config().historianConfig.find(x => x.Group == item.Group)?.Tags.find(y => y.Title == x);
                    const resData = response.find(d => d.Name == tag?.Tagname)?.records || [];
                    const value = resData[resData.length - 1];
                    if(value?.Value){
                      return value.Value;
                    } else {
                      return 0;
                    };
                  })
                };
                series.push(serie)
              } else {
                conf.tags
                  .filter(x => !x.time || x.time === 'd')
                  .forEach((x) => {
                    let data = response.find(d => d.Name == x.name);
                    if(data && data.records){
                      let res = this.chartOptions.getSeriesOptions(x.title, x.options, data);
                      series.push(res);
                    }
                  });
              }

              // สร้าง chart config object ใหม่
              newVal[item.Group] = {
                chart: this.chartOptions.getChartOptions(conf.chartOptions.chart),
                title: this.chartOptions.getTitleOptions(conf.chartOptions.title),
                xAxis: this.chartOptions.getXAxisoptions(conf.chartOptions.xAxis),
                yAxis: this.chartOptions.getYAxisoptions(conf.chartOptions.yAxis).map((yAxisOption, index) => {
                  if(yAxisOption?.plotLines && yAxisOption.plotLines.length > 0){
                    let plotLine = yAxisOption.plotLines.map((pl: any) => {
                        let val = 0;
                        if(pl.value && pl.value == 'maxValue'){
                          // หา max จาก series data
                          let max = 0;
                          series.forEach(s => {
                            if(s.data && Array.isArray(s.data)){
                              s.data.forEach((d: any) => {
                                if(typeof d === 'number' && d > max){
                                  max = d;
                                }
                              });
                            }
                          })
                          val = max;
                        } else if(pl.value && pl.value == 'minValue'){
                          // หา min จาก series data
                          let min = Number.MAX_VALUE;
                          series.forEach(s => {
                            if(s.data && Array.isArray(s.data)){
                              s.data.forEach((d: any) => {
                                if(typeof d === 'number' && d < min){
                                  min = d;
                                }
                              });
                            }
                          })
                          val = min === Number.MAX_VALUE ? 0 : min;
                        } else if(pl.value && pl.value == 'averageValue'){
                          // หา average จาก series data
                          let total = 0;
                          let count = 0;
                          series.forEach(s => {
                            if(s.data && Array.isArray(s.data)){
                              s.data.forEach((d: any) => {
                                if(typeof d === 'number'){
                                  total += d;
                                  count++;
                                }
                              });
                            }
                          })
                          val = count > 0 ? total / count : 0;
                        }
                        const label = pl.label?.text.replace('{value}', val.toFixed(2));
                        return {
                          ...pl,
                          value: val,
                          label: {
                            ...pl.label,
                            text: label
                          }
                        };
                    });
                    return {
                      ...yAxisOption,
                      plotLines: plotLine
                    };
                  } else {
                    return yAxisOption;
                  }
                }),
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
        this.store.dispatch(EfficiencyActions.loadEfficiencyChartDataSuccess({ data: this.dataChart() }));
        this.store.dispatch(EfficiencyActions.loadEfficiencyHistorianDataSuccess({ data: this.dataHistorian() }));
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

  async onChartUpdate(data: ChartPickerModel){
    const findRequest = this.requestHistorian().find(x => x.Group === data.name);
    const conf = this.config().chartConfig.find(x => x.name === data.name);
    if(findRequest && conf){
      this.loadingChart.set(data.name);

      const filteredTags = conf.tags.filter(x => !x.time || x.time === data.mode);

      const req: RequestHistorianModel[] = conf?.chartOptions?.xAxis?.categories
        ? findRequest.Request.map(x => ({
            ...x,
            Options: { ...x.Options, Time: '', StartTime: this.dateTimeSrv.getDateTime1(data.start), EndTime: this.dateTimeSrv.getDateTime1(data.end) }
          }))
        : filteredTags.map(tag => ({
            Name: tag.name,
            Options: {
              Interval: findRequest.Request.find(r => r.Name === tag.name)?.Options?.Interval,
              Time: '',
              StartTime: this.dateTimeSrv.getDateTime1(data.start),
              EndTime: this.dateTimeSrv.getDateTime1(data.end)
            }
          }));

      const response:ResponseHistorianModel[] = await this.http.getHistorian(req);
      if(response){
        // สร้าง object ใหม่แทนการ update
        this.dataChart.update(val => {
          // Clone object เดิมก่อน
          const newVal = { ...val };

          let series: SeriesOptionsType[] | SeriesLineOptions[] | SeriesAreaOptions[] | SeriesColumnOptions[] | any[] = [];
          if(conf){
            if(conf?.chartOptions?.xAxis?.categories){
              const categorie = conf?.chartOptions?.xAxis?.categories || [];
              let serie = {
                type: 'column',
                name: '',
                data: categorie.map((x: any) => {
                  const tag = this.config().historianConfig.find(x => x.Group == data.name)?.Tags.find(y => y.Title == x);
                  const resData = response.find(d => d.Name == tag?.Tagname)?.records || [];
                  const value = resData[resData.length - 1];
                  if(value?.Value){
                    return parseFloat(value.Value.replaceAll(',', ''));
                  } else {
                    return 0;
                  };
                })
              };
              series.push(serie)
            } else {
              filteredTags.forEach((x) => {
                let data = response.find(d => d.Name == x.name);
                if(data && data.records){
                  let res = this.chartOptions.getSeriesOptions(x.title, x.options, data);
                  series.push(res);
                }
              });
            }
            
            // สร้าง chart config object ใหม่
            newVal[findRequest.Group] = {
              chart: this.chartOptions.getChartOptions(conf.chartOptions.chart),
              title: this.chartOptions.getTitleOptions(conf.chartOptions.title),
              xAxis: conf?.chartOptions?.xAxis?.categories ?
                this.chartOptions.getXAxisoptions(conf.chartOptions.xAxis) : 
                this.chartOptions.getXAxisoptions({}),
              yAxis: this.chartOptions.getYAxisoptions(conf.chartOptions.yAxis).map((yAxisOption, index) => {
                if(yAxisOption?.plotLines && yAxisOption.plotLines.length > 0){
                  let plotLine = yAxisOption.plotLines.map((pl: any) => {
                      let val = 0;
                      if(pl.value && pl.value == 'maxValue'){
                        // หา max จาก series data
                        let max = 0;
                        series.forEach(s => {
                          if(s.data && Array.isArray(s.data)){
                            s.data.forEach((d: any) => {
                              if(typeof d === 'number' && d > max){
                                max = d;
                              }
                            });
                          }
                        })
                        val = max;
                      } else if(pl.value && pl.value == 'minValue'){
                        // หา min จาก series data
                        let min = Number.MAX_VALUE;
                        series.forEach(s => {
                          if(s.data && Array.isArray(s.data)){
                            s.data.forEach((d: any) => {
                              if(typeof d === 'number' && d < min){
                                min = d;
                              }
                            });
                          }
                        })
                        val = min === Number.MAX_VALUE ? 0 : min;
                      } else if(pl.value && pl.value == 'averageValue'){
                        // หา average จาก series data
                        let total = 0;
                        let count = 0;
                        series.forEach(s => {
                          if(s.data && Array.isArray(s.data)){
                            s.data.forEach((d: any) => {
                              if(typeof d === 'number'){
                                total += d;
                                count++;
                              }
                            });
                          }
                        })
                        val = count > 0 ? total / count : 0;
                      }
                      const label = pl.label?.text.replace('{value}', val.toFixed(2));
                      return {
                        ...pl,
                        value: val,
                        label: {
                          ...pl.label,
                          text: label
                        }
                      };
                  });
                  return {
                    ...yAxisOption,
                    plotLines: plotLine
                  };
                } else {
                  return yAxisOption;
                }
              }),
              legend: this.chartOptions.getLegendOptions(conf.chartOptions.legend),
              plotOptions: this.chartOptions.getPlotOptions(conf.chartOptions.plotOptions),
              series: [...series] // Clone array
            };
          }
          // Return object ใหม่ทั้งหมด
          return newVal;
        });
        
        response.map(data => {
          const conf = this.config().historianConfig.find(x => x.Group == findRequest.Group)?.Tags.find(y => y.Tagname == data.Name);
          if (conf) {
            this.dataHistorian.update(val => ({
              ...val,
              [conf.Title]: data
            }));
          }
          this.responseHistorian.update(val => [...val, data]);
        });
      }
      this.loadingChart.set('');
    }
  }

   
}
