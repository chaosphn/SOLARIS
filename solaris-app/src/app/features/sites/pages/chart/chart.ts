import { Component, ElementRef, HostListener, inject, OnDestroy, OnInit, QueryList, signal, ViewChild, ViewChildren } from '@angular/core';
import { SeriesAreaOptions, SeriesColumnOptions, SeriesLineOptions, SeriesOptionsType } from 'highcharts/highcharts';
import { ResponseTagsModel, TagsGroup } from '../../../../shared/models/tags.model';
import { EmitPeriodResult, RealtimeDataModel, TagsListConfig } from '../../../../shared/models/realtime.model';
import { ChartConfig, SeriesOptions } from '../../../../shared/models/config.model';
import { RequestHistorianModel, RequestRealtimeModel } from '../../../../shared/models/request.model';
import { ResponseHistorianModel, ResponseRealtimeModel } from '../../../../shared/models/response.model';
import { ChartParameters } from '../../../../shared/models/highchart.model';
import { Highchart } from '../../../../shared/components/highchart/highchart';
import { Property } from '../../../../shared/models/stackbar.model';
import { firstValueFrom, Observable, Subscription, timer } from 'rxjs';
import { NavbarStateModel } from '../../../../shared/models/navigate.model';
import { DisplayTag } from '../../../../shared/models/event.model';
import { HttpService } from '../../../../shared/services/http.service';
import { Store } from '@ngrx/store';
import { ChartService } from '../../../../shared/services/chart.service';
import { ExportXls } from '../../../../shared/services/export-xls';
import { Datetime } from '../../../../shared/services/datetime';
import { getNavState } from '../../../../store/selectors/nav.selectors';
import { resetTags } from '../../../../store/actions/tags.actions';

@Component({
  selector: 'app-chart',
  standalone: false,
  templateUrl: './chart.html',
  styleUrl: './chart.scss'
})
export class Chart implements OnInit, OnDestroy {
  configTags = signal<TagsGroup[]>([]);
  configTest = signal<TagsListConfig[]>([]);
  chartConf?: ChartConfig;
  requestrealtime: RequestRealtimeModel = {
    Tags: []
  };
  requestHistorian: RequestHistorianModel[] = [];
  responseRealtime = signal<ResponseRealtimeModel[]>([]);
  responseHistorian = signal<ResponseHistorianModel[]>([]);
  responseTags = signal<ResponseTagsModel[]>([]);
  groupDatas = signal<RealtimeDataModel[]>([]);
  chartParameter = signal<ChartParameters[]>([]);
  combinedChartParameter = signal<ChartParameters | null>(null);
  loadingImg = signal<boolean>(false);
  
  @ViewChildren(Highchart) charts!: QueryList<Highchart>;
  navState$: Observable<NavbarStateModel>;

  sub?: Subscription;
  timers?: Subscription;
  navSub?: Subscription;
  parameter: Property[] = [];
  siteSelected = signal<string>('');
  startDate: string = '';
  endDate: string = '';
  isChange: boolean = false;
  chartTag: DisplayTag[] = [];
  isCombinedChart: boolean = false;
  isLoadingChart: boolean = false;
  
  colorList: string[] = [
    '#15BBC2', '#278EFF', '#9945F5', '#F143AA', '#FF9059'
    ,'#F7F156', '#B2F76D', '#17A8EB', '#6766FF', '#C437D6'
    ,'#E95967', '#15BBC2', '#278EFF', '#9945F5', '#F143AA', '#FF9059'
    ,'#F7F156', '#B2F76D', '#17A8EB', '#6766FF', '#C437D6'
    ,'#E95967','#15BBC2', '#278EFF', '#9945F5', '#F143AA', '#FF9059'
    ,'#F7F156', '#B2F76D', '#17A8EB', '#6766FF', '#C437D6'
    ,'#E95967'
  ];

  @ViewChild('dropdownWrapper') dropdownWrapper!: ElementRef;

  isDropdownOpen = false;
  
  options: DropdownOption[] = [
    { value: 'line', label: 'Line Chart', icon: 'line_axis' },
    { value: 'area', label: 'Area Chart', icon: 'area_chart' },
    { value: 'column', label: 'Column Chart', icon: 'bar_chart' },
    { value: 'step', label: 'Step Chart', icon: 'line_axis' },
    { value: 'scatter', label: 'Scatter Chart', icon: 'scatter_plot' },
    { value: 'data-table', label: 'Data Table', icon: 'table_chart' }
  ];
  
  selectedOption: DropdownOption = this.options[0];

  private http = inject(HttpService);
  private store = inject(Store);
  private chartOptions = inject(ChartService);
  private excelExportService = inject(ExportXls);
  private dateTimeSrv = inject(Datetime);

  constructor(){
    this.navState$ = this.store.select(getNavState);
    this.navSub = this.navState$.subscribe(async (state) => {
      this.siteSelected.set(state.location);
      //this.store.dispatch(resetTags());
      await this.initPage();
    });
  }

  ngOnInit(): void {
    this.initPage();
  }
  

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.navSub?.unsubscribe();
    if(this.timers){
      this.timers.unsubscribe();
    }
  }
  
  async initPage(){
    await this.getConfig()
  }

  async getConfig(){
    try {
      const config = await this.http.getConfig2(`assets/site/charts/configurations/charts[${this.siteSelected()}].config.json`);
      this.chartConf = await this.http.getConfig2(`assets/site/charts/configurations/default.config.json`);
      if(config){
        this.configTest.set(config);
      } else {
        this.configTest.set([]);
      }
    } catch (error) {
      this.configTest.set([]);
    }
  }

  async getRealtimeData(){
    const realResponse: ResponseRealtimeModel[] = await this.http.getRealtime(this.requestrealtime)
    .then(response => response)
    .then(data => {
      return data;
    })
    .catch(() => {});
    this.responseRealtime.set(realResponse);
    return realResponse;
  }

  async getHistorianData(){
    const hisResponse: ResponseHistorianModel[] = await this.http.getHistorian(this.requestHistorian)
    .then(response => response)
    .then(data => {
      return data;
    })
    .catch(() => {});
    this.responseHistorian.set(hisResponse);
    return hisResponse;
  }

  startTimer(dueTimer: number) {
    this.timers = timer(dueTimer, dueTimer).subscribe(x => {
      this.updateData();
    });
  }

  async updateData(){
    if(this.requestHistorian){
      await this.getHistorianData();
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

  async emitTags(result: EmitPeriodResult){
    if(result){
      this.requestrealtime.Tags = result.tagsList;
      this.startDate = result.startDate;
      this.endDate = result.endDate;
      if(result.tagsList.length > 0 && result.startDate && result.endDate){
        const request: RequestHistorianModel[] = []; 
        result.tagsList.forEach(item => {
          request.push({
            Name: item,
            Options: {
              Time: '',
              StartTime: result.startDate,
              EndTime: result.endDate
            }
          });
        })
        this.requestHistorian = request.slice(0, 10);
      } 
    }
    if(this.requestHistorian){
      const data = await this.getHistorianData();
    }
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

  emitResponse(res: ResponseHistorianModel[]){
    this.isCombinedChart = false;
    this.responseHistorian.update(val => {
      return [...val, ...res]
    });
    
    this.chartParameter.update(val => {
      let item: ChartParameters = {};
      if(res){
        let series: SeriesOptionsType[] | SeriesLineOptions[] | SeriesAreaOptions[] | SeriesColumnOptions[] = []; 
        res.forEach((x, index) => {
          // กำหนด type ของ series ตาม selectedOption
          let chartType: 'line' | 'area' | 'column' | 'scatter' = 'line';
          
          switch(this.selectedOption.value) {
            case 'line':
              chartType = 'line';
              break;
            case 'area':
              chartType = 'area';
              break;
            case 'column':
              chartType = 'column';
              break;
            case 'scatter':
              chartType = 'scatter';
              break;
            case 'step':
              chartType = 'line'; // step จะใช้ line แต่จะต้องเพิ่ม step property
              break;
            default:
              chartType = 'line';
          }
          
          let options: SeriesOptions = {
            type: chartType,
            color: this.colorList[index],
            name: x.Name,
            showInLegend: true
          };
          
          if(x){
            let res = this.chartOptions.getSeriesOptions(
              x.Name.split('.')[1] + '.' + x.Name.split('.')[2] + '*' + x.Unit, 
              options, 
              x
            );
            
            // เพิ่ม step property สำหรับ step chart
            if(this.selectedOption.value === 'step') {
              res.step = true; // หรือ 'center', 'right' ตามต้องการ
            }
            
            series.push(res);
          }
        });
        
        item.chart = this.chartOptions.getChartOptions(this.chartConf?.chartOptions.chart);
        item.title = this.chartOptions.getTitleOptions(this.chartConf?.chartOptions.title);
        item.xAxis = this.chartOptions.getXAxisoptions(this.chartConf?.chartOptions.xAxis);
        item.yAxis = this.chartOptions.getYAxisoptions(this.chartConf?.chartOptions.yAxis);
        item.legend = {
          layout: "vertical",
          align: "right",
          verticalAlign: "top",
          floating: true,
          x: +40,
          y: -20,
          itemStyle:{
            fontWeight: 'bolder',
            fontSize: '12px'
          },
          labelFormatter: function() {
            let d: any = this.options;
            let color = d.color;
            let lastValue = 0;
            if(d.data[d.data.length - 1] && d.data[d.data.length - 1].length > 1){
              lastValue = d.data[d.data.length - 1][1];
              lastValue = parseInt(lastValue.toFixed(0));
            }
            let s = '<div class="d-flex-sb w-100 bz chart-legend-box" style="width: 170px; text-wrap: wrap;" ><span class="bz chart-legend" style="color:'+ color +';font-weight:500">' + this.name.split("*")[0] + '</span> <span class="bz chart-legend" style="padding-left:6px;font-weight:500;color:#bcd;"> ' + lastValue + '  ' + this.name.split("*")[1] + ' </span></div>';
            return s;
          },
          itemWidth: 200,
          useHTML: true,
          borderColor: 'red',
          symbolHeight: 0,
          symbolWidth: 0
        };
        
        // ปรับ plotOptions ตามชนิดของ chart
        let plotOptions = this.chartOptions.getPlotOptions(this.chartConf?.chartOptions.plotOptions);
        
        // เพิ่ม configuration เฉพาะสำหรับแต่ละ chart type
        if(this.selectedOption.value === 'scatter') {
          if(plotOptions.series) {
            plotOptions.series = {
              lineWidth: 0,
              marker: {
                enabled: true,
                radius: 4,
                symbol: 'circle'
              }
            }
          }
          plotOptions.scatter = {
            dataLabels: {
              enabled: false
            },
            marker: {
              radius: 4,
              symbol: 'circle',
              enabled: true,
              states: {
                hover: {
                  enabled: true,
                  lineColor: 'rgb(100,100,100)'
                }
              }
            },
            tooltip: {
              headerFormat: '<b>{series.name}</b><br>',
              pointFormat: '{point.x:%Y-%m-%d %H:%M:%S}<br/>Value: {point.y}'
            }
          };
        } else if(this.selectedOption.value === 'area') {
          plotOptions.area = {
            fillOpacity: 0.3,
            lineWidth: 2,
            marker: {
              enabled: false
            }
          };
        } else if(this.selectedOption.value === 'column') {
          plotOptions.column = {
            borderWidth: 0,
            borderRadius: 3,
            groupPadding: 0.1,
            pointPadding: 0.05
          };
        }
        
        item.plotOptions = plotOptions;
        item.series = series;
      }
      
      val.push(item);
      return val;
    });
    this.addSyncEvents();
    // Update combined chart if enabled
    if(this.isCombinedChart) {
      this.updateCombinedChart();
    }
  };

  toggleCombineChart(): void {
    this.isCombinedChart = !this.isCombinedChart;

    if(this.isCombinedChart) {
      this.updateCombinedChart();
    } else {
      this.combinedChartParameter.set(null);
      this.addSyncEvents();
    }
  }

  onDateChange(event: any){
    if(event.type == 'start'){
      this.startDate = event.value;
    } else if(event.type == 'end'){
      this.endDate = event.value;
    }
  }


  getRandomColor(): string {
    const minRGB = 1;
    const maxRGB = 255;

    let red, green, blue;
    do {
        red = Math.floor(Math.random() * (maxRGB - minRGB + 1)) + minRGB;
        green = Math.floor(Math.random() * (maxRGB - minRGB + 1)) + minRGB;
        blue = Math.floor(Math.random() * (maxRGB - minRGB + 1)) + minRGB;
    } while (red > 130 && green === 0 && blue === 0);

    const hex = `#${red.toString(16)}${green.toString(16)}${blue.toString(16)}`;

    return hex;
  }

  exportToExcel(data: ResponseHistorianModel[]): void {
    const date = this.dateTimeSrv.getDateTime1(new Date());
    this.excelExportService.exportToExcel(data, 'exported_data_'+date.slice(0,10));
  }

  exportAllToExcel(): void {
    const date = this.dateTimeSrv.getDateTime1(new Date());
    this.excelExportService.exportToExcel(this.responseHistorian().flat(), 'exported_data_'+date.slice(0,10));
  }

  clearData(){
    this.chartParameter.set([]);
    this.responseHistorian.set([]);
    this.combinedChartParameter.set(null);
    this.isCombinedChart = false;
  }

  ngAfterViewInit() {
    this.charts.changes.subscribe(() => {
      this.addSyncEvents();
    });
    this.addSyncEvents();
  }

  // เรียกทุกครั้งที่ chart ถูก (re)create — highchart destroy+recreate ทุก update → container ใหม่ต้องผูก listener ใหม่
  onChartRebind(): void {
    this.addSyncEvents();
  }

  private addSyncEvents() {
    this.charts.forEach(cmp => {
      const chart = cmp.ref;
      // ผูก listener แค่ครั้งเดียวต่อ container. container ที่ถูก recreate = ตัวใหม่ (ไม่มี flag) → ผูกใหม่อัตโนมัติ, กันซ้อนบน container เดิม
      if (chart && !(chart.container as any).__syncBound) {
        (chart.container as any).__syncBound = true;
        chart.container.addEventListener('mousemove', (e) => this.syncTooltip(e, chart));
        chart.container.addEventListener('mouseleave', () => this.hideTooltips());
        chart.container.addEventListener('touchstart', (e) => this.syncTooltip(e, chart));
        chart.container.addEventListener('touchmove', (e) => this.syncTooltip(e, chart));
        chart.container.addEventListener('touchend', () => this.hideTooltips());
      }
    });
  }

  onLoadingData(event: boolean): void {
    this.isLoadingChart = event;
  }

  private syncTooltip(e: MouseEvent | TouchEvent, sourceChart: Highcharts.Chart) {
    const event = (sourceChart.pointer.normalize(e) as any);
    
    // ใช้ RequestAnimationFrame เพื่อให้ sync smooth
    requestAnimationFrame(() => {
      this.charts.forEach(cmp => {
        const chart = cmp.ref;
        if (chart && chart !== sourceChart && chart.series && chart.series.length > 0) {
          try {
            // ค้นหา point จาก series แรก
            const point = chart.series[0].searchPoint(event, true);
            if (point) {
              // ปรับปรุง tooltip เพื่อให้ sync กับ source chart
              const pointsAtX: any[] = [];
              
              // เก็บ points ทั้งหมดที่มี x value เดียวกัน
              chart.series.forEach(series => {
                const p = series.searchPoint(event, true);
                if (p) {
                  pointsAtX.push(p);
                }
              });
              
              if (pointsAtX.length > 0) {
                // แสดง tooltip พร้อม points ทั้งหมด
                chart.tooltip.refresh(pointsAtX);
                // แสดง crosshair บน x-axis
                if(chart.xAxis && chart.xAxis[0]) {
                  chart.xAxis[0].drawCrosshair(event);
                }
              }
            } else {
              // ซ่อน tooltip ถ้าไม่มี point
              chart.tooltip.hide();
              if(chart.xAxis && chart.xAxis[0]) {
                chart.xAxis[0].hideCrosshair();
              }
            }
          } catch (err) {
            // Handle error silently
            //console.debug('Sync tooltip error:', err);
          }
        }
      });
    });
  }

  private hideTooltips() {
    this.charts.forEach(cmp => {
      if (cmp.ref) {
        try {
          cmp.ref.tooltip.hide();
          if(cmp.ref.xAxis && cmp.ref.xAxis[0]) {
            cmp.ref.xAxis[0].hideCrosshair();
          }
        } catch (err) {
          //console.debug('Hide tooltip error:', err);
        }
      }
    });
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectOption(event: Event, option: DropdownOption): void {
    event.stopPropagation();
    this.selectedOption = option;
    this.isDropdownOpen = false;
    
    
    this.onOptionChange(option.value);
  }

  onOptionChange(value: string): void {
    // อัพเดท chart type ของทุก chart ที่มีอยู่
    if(value !== 'data-table') {
      this.chartParameter.update(charts => {
        return charts.map(chart => {
          // กำหนด chart type ใหม่
          let chartType: 'line' | 'area' | 'column' | 'scatter' = 'line';
          
          switch(value) {
            case 'line':
              chartType = 'line';
              break;
            case 'area':
              chartType = 'area';
              break;
            case 'column':
              chartType = 'column';
              break;
            case 'scatter':
              chartType = 'scatter';
              break;
            case 'step':
              chartType = 'line';
              break;
            default:
              chartType = 'line';
          }
          
          // อัพเดท series type
          const updatedSeries = chart.series?.map(s => {
            const updatedS: any = {
              ...s,
              type: chartType
            };
            
            // เพิ่ม step property สำหรับ step chart
            if(value === 'step') {
              updatedS.step = true;
            } else {
              delete updatedS.step;
            }
            
            return updatedS;
          });
          
          // ปรับ plotOptions ตามชนิดของ chart
        let plotOptions = this.chartOptions.getPlotOptions(this.chartConf?.chartOptions.plotOptions);
        
        // เพิ่ม configuration เฉพาะสำหรับแต่ละ chart type
        if(this.selectedOption.value === 'scatter') {
          if(plotOptions.series) {
            plotOptions.series = {
              lineWidth: 0,
              marker: {
                enabled: true,
                radius: 4,
                symbol: 'circle'
              }
            }
          }
          plotOptions.scatter = {
            dataLabels: {
              enabled: false
            },
            marker: {
              radius: 4,
              symbol: 'circle',
              enabled: true,
              states: {
                hover: {
                  enabled: true,
                  lineColor: 'rgb(100,100,100)'
                }
              }
            },
            tooltip: {
              headerFormat: '<b>{series.name}</b><br>',
              pointFormat: '{point.x:%Y-%m-%d %H:%M:%S}<br/>Value: {point.y}'
            }
          };
        } else if(this.selectedOption.value === 'area') {
          plotOptions.area = {
            fillOpacity: 0.3,
            lineWidth: 2,
            marker: {
              enabled: false
            }
          };
        } else if(this.selectedOption.value === 'column') {
          plotOptions.column = {
            borderWidth: 0,
            borderRadius: 3,
            groupPadding: 0.1,
            pointPadding: 0.05
          };
        }
          
          return {
            ...chart,
            series: updatedSeries,
            plotOptions: plotOptions
          };
        });
      });
      
      // อัพเดท combined chart ถ้าเปิดอยู่
      this.updateCombinedChart();
    }
  }

  @HostListener('document:click', ['$event'])
  closeDropdown(event: Event): void {
    if (this.dropdownWrapper && 
        !this.dropdownWrapper.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }

  captureChart(): void {
    if(this.loadingImg()) return; 
    this.loadingImg.set(true);
    if (this.isCombinedChart) {
      // Capture combined chart
      const chartElement = document.getElementById('combined-chart');
      if (chartElement) {
        this.captureElement(chartElement, 'chart');
      } else {
        this.loadingImg.set(false);
      }
    } else {
      // Capture all individual charts
      // this.chartParameter().forEach((chart, index) => {
      //   const chartElement = document.getElementById('chart-' + index);
      //   if (chartElement) {
      //     this.captureElement(chartElement, `chart-${index}`);
      //   }
      // });
      const chartElement = document.getElementById('combined-chart');
      if (chartElement) {
        this.captureElement(chartElement, 'chart');
      } else {
        this.loadingImg.set(false);
      }
    }
  }

  private captureElement(element: HTMLElement, filename: string): void {
    // Using html2canvas library
    import('html2canvas').then(html2canvas => {
      html2canvas.default(element, {
        backgroundColor: '#1a1a1a',
        scale: 2,
        logging: false,
        useCORS: true
      }).then((canvas: any) => {
        const link = document.createElement('a');
        const date = this.dateTimeSrv.getDateTime1(new Date());
        link.download = `${filename}_${date.slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        this.loadingImg.set(false);
      }).catch((err: any) => {
        //console.error('Error capturing chart:', err);
        this.loadingImg.set(false);
      });
    });
  }


  updateCombinedChart(): void {
    const allCharts = this.chartParameter();
    
    if(allCharts.length === 0) {
      this.combinedChartParameter.set(null);
      return;
    }

    // กำหนด chart type ตาม selectedOption
    let chartType: 'line' | 'area' | 'column' | 'scatter' = 'line';
    
    switch(this.selectedOption.value) {
      case 'line':
        chartType = 'line';
        break;
      case 'area':
        chartType = 'area';
        break;
      case 'column':
        chartType = 'column';
        break;
      case 'scatter':
        chartType = 'scatter';
        break;
      case 'step':
        chartType = 'line';
        break;
      default:
        chartType = 'line';
    }

    // Combine all series from all charts
    let combinedSeries: SeriesOptionsType[] = [];
    let colorIndex = 0;

    allCharts.forEach(chart => {
      if(chart.series) {
        chart.series.forEach(series => {
          const combinedSeriesItem: any = {
            ...series,
            type: chartType,
            color: this.colorList[colorIndex % this.colorList.length]
          };
          
          // เพิ่ม step property สำหรับ step chart
          if(this.selectedOption.value === 'step') {
            combinedSeriesItem.step = true;
          }
          
          combinedSeries.push(combinedSeriesItem);
          colorIndex++;
        });
      }
    });


    let plotOptions = this.chartOptions.getPlotOptions(this.chartConf?.chartOptions.plotOptions);

    if(this.selectedOption.value === 'scatter') {
      if(plotOptions.series) {
        plotOptions.series = {
          lineWidth: 0,
          marker: {
            enabled: true,
            radius: 4,
            symbol: 'circle'
          }
        }
      }
      plotOptions.scatter = {
        dataLabels: {
          enabled: false
        },
        marker: {
          radius: 4,
          symbol: 'circle',
          enabled: true,
          states: {
            hover: {
              enabled: true,
              lineColor: 'rgb(100,100,100)'
            }
          }
        },
        tooltip: {
          headerFormat: '<b>{series.name}</b><br>',
          pointFormat: '{point.x:%Y-%m-%d %H:%M:%S}<br/>Value: {point.y}'
        }
      };
    } else if(this.selectedOption.value === 'area') {
      plotOptions.area = {
        fillOpacity: 0.3,
        lineWidth: 2,
        marker: {
          enabled: false
        }
      };
    } else if(this.selectedOption.value === 'column') {
      plotOptions.column = {
        borderWidth: 0,
        borderRadius: 3,
        groupPadding: 0.1,
        pointPadding: 0.05
      };
    }

    // Create combined chart parameter
    const combinedChart: ChartParameters = {
      chart: this.chartOptions.getChartOptions(this.chartConf?.chartOptions.chart),
      title: this.chartOptions.getTitleOptions(this.chartConf?.chartOptions.title),
      xAxis: this.chartOptions.getXAxisoptions(this.chartConf?.chartOptions.xAxis),
      yAxis: this.chartOptions.getYAxisoptions(this.chartConf?.chartOptions.yAxis),
      legend: {
        layout: "vertical",
        align: "right",
        verticalAlign: "top",
        floating: true,
        x: +40,
        y: -20,
        itemStyle:{
          fontWeight: 'bolder',
          fontSize: '12px'
        },
        labelFormatter: function() {
          let d:any = this.options;
          let color = d.color;
          let lastValue = 0;
          if(d.data[d.data.length - 1] && d.data[d.data.length - 1].length > 1){
            lastValue = d.data[d.data.length - 1][1];
            lastValue = parseInt(lastValue.toFixed(0));
          }
          let s = '<div class="d-flex-sb w-100 bz chart-legend-box" style="width: 170px; text-wrap: wrap;" ><span class="bz chart-legend" style="color:'+ color +';font-weight:500">' + this.name.split("*")[0] + '</span> <span class="bz chart-legend" style="padding-left:6px;font-weight:500;color:#bcd;"> ' + lastValue + '  ' + this.name.split("*")[1] + ' </span></div>';
          return s;
        },
        itemWidth: 200,
        useHTML: true,
        borderColor: 'red',
        symbolHeight: 0,
        symbolWidth: 0
      },
      plotOptions: plotOptions,
      series: combinedSeries
    };

    this.combinedChartParameter.set(combinedChart);
  }

}

interface DropdownOption {
  value: string;
  label: string;
  icon: string;
}
