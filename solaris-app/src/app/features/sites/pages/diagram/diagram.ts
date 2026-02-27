import { Component, computed, effect, ElementRef, inject, OnChanges, OnDestroy, OnInit, signal, ViewChild, viewChild } from '@angular/core';
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
import { isString, SeriesAreaOptions, SeriesColumnOptions, SeriesLineOptions, SeriesOptionsType } from 'highcharts';
import * as DiagramActions from '../../store/actions/diagram.action';
import * as DiagramSelectors from '../../store/selectors/diagram.selector';
import { getNavState } from '../../../../store/selectors/nav.selectors';
import { getZoneConfig } from '../../../../store/selectors/site.selectors';
import { MapConfigModel } from '../../../../shared/models/svg.model';
import { PlantStatusData } from '../../../../shared/components/piechart/piechart';
import { setDateEnable } from '../../../../store/actions/date.actions';
import { ColorRangeModel, PanelConfigModel } from '../../../../shared/models/panel.model';
import { ChartPickerModel } from '../../../../shared/components/chart-card/chart-card';
import { DiagramConfigModel } from '../../models/diagram.model';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { sendMessage } from '../../../../store/actions/toaster.actions';
import { DeviceConfigModel } from '../../../../shared/models/device.model';
import { InverterDialog } from '../../../../shared/components/inverter-dialog/inverter-dialog';
import { MeterDialog } from '../../../../shared/components/meter-dialog/meter-dialog';


@Component({
  selector: 'app-diagram',
  standalone: false,
  templateUrl: './diagram.html',
  styleUrl: './diagram.scss',
})
export class Diagram implements OnInit, OnDestroy {

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

  diagramList = signal<DiagramConfigModel[]>([]);
  selectedDiagram = signal<DiagramConfigModel>({} as DiagramConfigModel);
  svgSafe = signal<SafeHtml>('');
  private svgTemplate = signal<string>('');
  @ViewChild('svgContainer', { static: false }) 
  svgContainer!: ElementRef;

  zoneSelected = signal<string>('overall');

  timers?: Subscription;
  navSub?: Subscription;
  svgSub?: Subscription;
  storeSub?: Subscription;
  storeSub2?: Subscription;

  date: Date = new Date();

  private http = inject(HttpService);
  private store = inject(Store);
  private appInit = inject(AppInitService);
  private dateTimeSrv = inject(Datetime);
  private sanitizer = inject(DomSanitizer);
  private dialog = inject(MatDialog);

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

    effect(() => {
      if(this.dataRealtime()){
        this.updateSvg();
      }
    })
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
    //this.store.dispatch(DiagramActions.resetDiagramState());
  }

  async initPage(){
    this.timers?.unsubscribe();

    // Check if data exists in store first
    const hasConfig = await this.loadFromStoreIfExists();
    
    if (!hasConfig) {
      await this.getConfig();
      this.store.dispatch(DiagramActions.loadDiagramConfigTimeStamp({ timestamp: new Date() }));
    }

    await this.getDiagramsConfig();

    this.getRequest();
    await this.getData();
    
    if(this.appInit.config.Timer){
      this.startTimer(this.appInit.config.Timer * 60000);
    }

  }

  private async loadFromStoreIfExists(): Promise<boolean> {
    return new Promise((resolve) => {
      this.storeSub = this.store.select(DiagramSelectors.selectDiagramState).subscribe(state => {
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
        
        // Check if data exists and load it
        if (state.data_realtime && Object.keys(state.data_realtime).length > 0) {
          this.dataRealtime.set(state.data_realtime);
          hasData = true;
        }
        
        resolve(hasData);
      });
    });
  }

  async getConfig() {
    try {
      const config = await this.http.getConfig2(`assets/site/diagram/configurations/diagram[${this.siteSelected()}].config.json`);
      if (config) {
        this.config.set(config);
        this.store.dispatch(DiagramActions.loadDiagramConfigSuccess({ config }));
      }
    } catch (error) {
      //console.error('Error fetching config', error);
      this.store.dispatch(DiagramActions.loadDiagramConfigFailure({ error: error as string }));
    }
  }

  async getDiagramsConfig() {
    try {
      const config: any[] = await this.http.getConfig2(`assets/site/diagram/property/svg[${this.siteSelected()}].config.json`);
      if (config && config.length > 0) {
        this.diagramList.set(config);
        this.selectedDiagram.set(config[0]);
        await this.loadSvgFile();
      }
    } catch (error) {
      //console.error('Error fetching config', error);
    }
  }

  async loadSvgFile() {
    try {
      const svgSubscription = await this.http.getConfigFile(`assets/site/diagram/svg/svg[${this.siteSelected()}][${this.selectedDiagram().name}].html`);
      if(svgSubscription){
        //console.log(svgSubscription)
        this.svgTemplate.set(svgSubscription);
        this.updateSvg();
      } else {
        //console.log(svgSubscription)
        this.svgTemplate.set(`
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:30px; border:1px solid #ddd; border-radius:8px; background:#f9f9f9; color:#333;">
            <h2 style="margin-bottom:10px;">Diagram Not Found</h2>
            <p style="font-size:14px;">The file you requested is missing or unavailable.</p>
          </div>`
        );
      }
    } catch (error: any) {
      if (error.status === 404) {
        this.svgTemplate.set(`<p>Not found works!</p>`);
      } else {
        this.svgTemplate.set(`
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:30px; border:1px solid #ddd; border-radius:8px; background:#f9f9f9; color:#333;">
            <h2 style="margin-bottom:10px;">Diagram Not Found</h2>
            <p style="font-size:14px;">The file you requested is missing or unavailable.</p>
          </div>`
        );
      }
      this.updateSvg();
    }
  }

  private updateSvg() {
    if (!this.svgTemplate) {
      //console.log('No SVG template yet');
      return;
    }
    
    //console.log('Updating SVG with current values:', this.currentValues);
    
    let processedSvg = this.svgTemplate();
    
    // Simple regex to find all {{...}} patterns
    const matches = processedSvg.match(/\{\{[^}]+\}\}/g);
    
    if (matches) {
      //console.log('Found placeholders:', matches);
      
      matches.forEach(placeholder => {
        // Extract tag name from placeholder
        const content = placeholder.replace(/\{\{|\}\}/g, '').trim();
        
        // Handle different formats:
        // DG1_CONS_RATE?.value || 1111
        // DG1_CONS_RATE
        // DG1_CONS_RATE.value
        
        let value = this.getReplacementValue(content);
        
        //console.log(`Replacing ${placeholder} with ${value}`);
        
        // Replace ALL occurrences of this placeholder
        processedSvg = processedSvg.split(placeholder).join(value.toString());
      });
    }
    
    //console.log('Final processed SVG length:', processedSvg.length);
    
    // Sanitize and update
    this.svgSafe.set(this.sanitizer.bypassSecurityTrustHtml(processedSvg));

    requestAnimationFrame(() => {
      this.centerAllMsgText();
      this.bindSvgClickEvents();  
    });
  }

 private centerAllMsgText() {
    if (!this.svgContainer) return;

    const root: HTMLElement = this.svgContainer.nativeElement;

    // หาเฉพาะ group ที่มี rectangle message box
    const groups = root.querySelectorAll('g');

    groups.forEach((group: any) => {

      const rect = group.querySelector('rect');
      const tspan = group.querySelector('tspan');

      if (!rect || !tspan) return;

      // filter เฉพาะกล่อง message (สูง 16.25)
      const h = rect.getAttribute('height');
      if (h !== '16.25') return;

      const x = parseFloat(rect.getAttribute('x'));
      const y = parseFloat(rect.getAttribute('y'));
      const w = parseFloat(rect.getAttribute('width'));
      const height = parseFloat(rect.getAttribute('height'));

      const cx = x + w / 2;
      const cy = y + height / 2;

      // 🔥 สำคัญ — ต้อง set ที่ tspan
      tspan.setAttribute('x', cx.toString());
      tspan.setAttribute('y', cy.toString());

      const text = tspan.parentElement;

      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
    });
  }

  private bindSvgClickEvents() {
    if (!this.svgContainer) return;

    const root: HTMLElement = this.svgContainer.nativeElement;

    const nodes = root.querySelectorAll('[data-click]');

    nodes.forEach((el: any) => {

      el.style.cursor = 'pointer';

      el.onclick = () => {
        const val = el.getAttribute('data-click');
        if (!val) return;

        const [deviceId, deviceType] = val.split(',');

        this.handleOpenDialog(deviceId, deviceType);
      };
    });
  }


  
  private getReplacementValue(expression: string): string {
    //console.log('Processing expression:', expression);
    
    // Clean the expression
    let cleanExpr = expression
      .replace(/\?\./g, '.') // Remove ?. 
      .replace(/\s*\|\|\s*\d+/g, '') // Remove || number
      .replace(/\s*\|\|\s*'[^']*'/g, '') // Remove || 'string'
      .trim();
    
    // Parse tag name and property
    const parts = cleanExpr.split('.');
    const tagName = parts[0];
    const property = parts[1] || 'Value';
    
    //console.log('Tag:', tagName, 'Property:', property);
    
    // Get value from current data
    if (this.dataRealtime()[tagName]) {
      const tagData: ResponseRealtimeModel = this.dataRealtime()[tagName];
      //console.log('Found tag data:', tagData);
      
      switch (property) {
        case 'Value':
          const value = tagData.Value;

          if (typeof value === 'string') {
            const num = Number(value.replace(/,/g, ''));

            if (Number.isFinite(num)) {
              return num.toFixed(1);
            }

            return value;
          }

          if (typeof value === 'number') {
            return value.toFixed(1);
          }

          if (typeof value === 'boolean') {
            return value.toString();
          }

          return 'unknow';
        case 'Msg':
          let val = tagData.Value;
          const mapVal = this.selectedDiagram().textBinding.find(x => x.value == val)?.message??undefined;
          if(mapVal){
            return mapVal;
          }
          return val.toString() || 'unknow';
        case 'Timestamp':
          let timestamp = new Date(tagData.TimeStamp);
          if(timestamp){
            const dt = timestamp.getTime() + (7*60*60*1000);
            return new Date(dt).toISOString();
          } else {
            return '---';
          }
        case 'Color':
          let val1 = tagData.Value;
          const mapColor = this.selectedDiagram().colorBinding.find(x => x.value == val1)?.color??undefined;
          if(mapColor){
            return mapColor;
          }
          return 'unknow';
        default:
          return tagData.Value.toString() || '';
      }
    } else {
      return "---";
    }
  }

  tranfromMessage(msg: string){
    const lng = msg.length;
    let result = msg;
    for (let index = 0; result.length <= 20; index++) {
      result = '-' + result + '-';
    }
    console.log(result, lng)
    return result;
  }

  getRequest(){
    // Only generate requests if they don't exist
    if (!this.requestRealtime() || this.requestRealtime().length === 0) {
      this.getRealtimeRequest();
    }
    if (!this.requestAttime() || this.requestAttime().length === 0) {
      this.getAttimeRequest();
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
      this.store.dispatch(DiagramActions.loadDiagramRealtimeData({ requests: sortedReq }));
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
      this.store.dispatch(DiagramActions.loadDiagramAtTimeData({ requests: sortedReq }));
    }
  }


  async getData(){
    // Check if data needs to be refreshed based on timestamp
    const shouldRefresh = await this.shouldRefreshData();
    
    // Only fetch data if it doesn't exist or needs refresh
    if (!this.dataRealtime() || Object.keys(this.dataRealtime()).length === 0 || shouldRefresh) {
      await this.getRealtimeData();
      this.store.dispatch(DiagramActions.loadDiagramConfigTimeStamp({ timestamp: new Date() }))
    }

    //await this.getAtTimeData();
  }

  private async shouldRefreshData(): Promise<boolean> {
    return new Promise((resolve) => {
      this.storeSub2 = this.store.select(DiagramSelectors.selectDiagramTimestamp).subscribe(timestamp => {
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
                  Value: data.Value
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
        this.store.dispatch(DiagramActions.loadDiagramRealtimeDataSuccess({ data: this.dataRealtime() }));
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
      this.store.dispatch(DiagramActions.loadDiagramRealtimeDataSuccess({ data: this.dataRealtime() }));
    }
  }

  startTimer(dueTimer: number) {
    this.timers = timer(dueTimer, dueTimer).subscribe(x => {
      this.updateData();
    });
  }

  async updateData(){
    await this.getRealtimeData();
    this.updateSvg();
    //await this.getAtTimeData();
  }

  changeTabs(item: DiagramConfigModel ){
    this.selectedDiagram.set(item);
    this.loadSvgFile();
  }

  async handleOpenDialog(deviceId: string, deviceType: string){
    if(!deviceId){
      this.store.dispatch(sendMessage({ 
        payload: { type: 'error', text: 'No Device ID' }
      }));
    }

    if(!deviceType){
      this.store.dispatch(sendMessage({ 
        payload: { type: 'error', text: 'No Device Type' }
      }));
    }

    const config: DeviceConfigModel = await this.http.getConfig2(`assets/site/diagram/equipments/${deviceType}.config.json`);
    if (config) {
      switch (config.Type) {
        case 'inverter':
          this.dialog.open(InverterDialog, {
            width: '1000px',
            maxWidth: '100vw',  
            disableClose: false,
            data: {
              siteId: this.siteSelected(),
              deviceId: deviceId,
              deviceConfig: config
            }
          });
          break;
        case 'meter':
          this.dialog.open(MeterDialog, {
            width: '1000px',
            maxWidth: '100vw',   
            disableClose: false,
            data: {
              siteId: this.siteSelected(),
              deviceId: deviceId,
              deviceConfig: config
            }
          });
          break;
        default:
          break;
      }
    }

  }
  
}

interface TagData {
  Value: string | number | boolean | null | undefined;
}
