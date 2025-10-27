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
import { AliasList, RealtimeDataModel, TagParameter, TagsConfigList, TagsListConfig } from '../../../../shared/models/realtime.model';
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
  tableData = computed(() => {
    const item: any[] = [];
    if(this.tableRow() && this.tableHeader() && this.responseRealtime()){
      this.tableRow().forEach(x => {
        let row:any = {};
        this.tableHeader().forEach( i => {
          row[i.name] = this.responseRealtime().find( d => d.Name.includes( x + '.' + i.name));
        });
        row['NAME'] = {Name: x, Value: x, Unit: '', TimeStamp: '', Min: 0, Max: 0};
        item.push(row);
      });
    }
    //console.log(item)
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

  date: Date = new Date();

  private http = inject(HttpService);
  private store = inject(Store);
  private appInit = inject(AppInitService);
  private chartOptions = inject(ChartService);
  private dateTimeSrv = inject(Datetime);
  constructor(){
    this.navState$ = this.store.select(getNavState);
    this.navSub = this.navState$.subscribe(async (state) => {
      console.log(state.location)
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
    if(this.appInit.config.Timer){
      //this.startTimer(this.appInit.config.Timer * 60000);
    }

  }

  async getConfig() {
    try {
      const config = await this.http.getConfig2(`assets/site/realtime/configurations/realtime[${this.siteSelected()}].config.json`);
      if (config) {
        this.configTags.set(config);
      }
    } catch (error) {
      console.error('Error fetching config', error);
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
      console.log(request);
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
    this.timers = timer(dueTimer, dueTimer).subscribe(x => {
      this.updateData();
    });
  }

  async updateData(){
    await this.getRealtimeData();
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

  sortDatatable(item: any){
    const key = item.key;
    const type = item.type;
    const tableSorted = this.tableData().sort((a,b) => {
      if (type === 'asc') {
        return this.tranformNumber(a[key].Value) - this.tranformNumber(b[key].Value);
      } else {
        return this.tranformNumber(b[key].Value) - this.tranformNumber(a[key].Value);
      }
    })
    ////console.log(tableSorted)
  }

  tranformNumber(val: string){
    if(val == null){
      val = "-1";
    }
    const res = parseFloat(val.replaceAll(",",""));
    //console.log(res)
    if(res >= 0){
      return res;
    } else {
      return -1;
    }
  }
   
}