import { inject, Injectable } from '@angular/core';
import { Datetime } from './datetime';
import { ChartOptions, LegendOptions, PlotOptions, ResponsiveOptions, SeriesOptionsType, TitleOptions, TooltipOptions, XAxisOptions, YAxisOptions, isNumber } from 'highcharts/highcharts';
import { SeriesOptions } from '../models/config.model';
import { ResponseHistorianModel } from '../models/response.model';

@Injectable({
  providedIn: 'root'
})
export class ChartService {
  startDate:number | undefined = undefined;
  endDate:number | undefined = undefined;
  
  private dateSer = inject(Datetime);
  constructor() { }

  getChartParameter(){
    //const parameter: ChartConfigs;
  }

  getChartOptions(item:ChartOptions | undefined){
    if( item && Object.keys(item).length > 0 ){
      const initChart: ChartOptions = {
        zooming: {
          type: item.zooming?.type || 'x',
          resetButton: {
            position: {
              x: item.zooming?.resetButton?.position?.x || undefined,
              y: item.zooming?.resetButton?.position?.y || -40,
              verticalAlign: item.zooming?.resetButton?.position?.verticalAlign || 'bottom',
              align: item.zooming?.resetButton?.position?.align || undefined
            },
            theme: {
              fill: item.zooming?.resetButton?.theme?.fill || '#FD674E',
              style: item.zooming?.resetButton?.theme?.style || {color: 'white'},
              states: {
                hover: {
                  fill: item.zooming?.resetButton?.theme?.fill || '#FD674E',
                  style: item.zooming?.resetButton?.theme?.style || {
                    color: 'white',
                  },
                } 
              }
            }
          }
        },
        backgroundColor: item.backgroundColor || 'none',
        borderRadius: item.borderRadius || undefined,
        animation: item.animation || false,
        margin: item.margin || [0,0,0,0,],
        borderColor: item.borderColor || '#2d3136',
        borderWidth: item.borderWidth,
      }
      //console.log(item)
      return initChart;
    } else {
      const defaultChart: ChartOptions = {
        zooming: {
          type: 'x',
          resetButton: {
            position: {
              y: -40,
              verticalAlign: 'bottom',
              align: 'right'
            },
            theme: {
              fill: '#FF9B33',
                style: {
                  color: 'white'
                },
                states: {
                  hover: {
                    fill: '#FF9B33',
                    style: {
                      color: 'white',
                    },
                  } 
                }
            }
          }
        },
        backgroundColor: 'none',
        animation: false,
        margin: [0,0,0,0,],
        borderColor: '#2d3136',
        borderWidth: 1
      }
      return defaultChart;
    }
  }

  getTitleOptions(item: TitleOptions | undefined){
    if(item && Object.keys(item).length > 0){
      const initTitle: TitleOptions = {
        text: item.text,
        align: item.align || 'center',
        floating: item.floating,
        margin: item.margin ,
        style: {
          color: "Whitesmoke",
          fontSize: "18px",
          fontFamily: "bold"
        } 
      }
      return initTitle;
    } else {
      const defaultTitle: TitleOptions = {
        text: undefined
      }
      return defaultTitle
    }
  }

  getXAxisoptions(item: XAxisOptions | undefined, minDate?: string, maxDate?: string){
    if(item && Object.keys(item).length > 0){
      if(item.max != undefined){
        const period = this.dateSer.parseDate(item.max.toString());
        //console.log(period)
        if(period.startTime && period.endTime){
          this.startDate = new Date(period.startTime).getTime() + 7 * 60 * 60 * 1000;
          this.endDate = new Date(period.endTime).getTime() + 7 * 60 * 60 * 1000;
          //console.log('Start1: '+this.startDate+'\nEnd1: '+this.endDate);
        }
        if(item.max.toString().includes('d')){
          item.labels = {
            enabled: true,
            style: item.labels?.style,
            useHTML: true,
            formatter: function(){
              //console.log(new Date(this.value))
              return new Date(this.value).toDateString().slice(0,3);
            },
          }
        }
        if(item.max.toString().includes('y')){
          this.startDate = undefined;
          this.endDate = undefined;
        }
      } 
      else {
        if(minDate && maxDate){
          this.startDate = new Date(this.dateSer.getDateTime(minDate)).getTime();
          this.endDate = new Date(this.dateSer.getDateTime(maxDate)).getTime();
        } else {
          this.startDate = undefined;
          this.endDate = undefined;
        }
      }
      const initXAxis: XAxisOptions = {
        type: item.type ,
        gridLineColor: item.gridLineColor ,
        gridLineWidth: item.gridLineWidth ,
        labels: item.labels,
        lineColor: item.lineColor ,
        lineWidth: item.lineWidth ,
        tickInterval: item.tickInterval,
        categories: item.categories ,
        crosshair: item.crosshair ,
        min: this.startDate ,
        max: this.endDate,
      }
      return initXAxis;
    } else {
      if(minDate && maxDate){
        this.startDate = new Date(this.dateSer.getDateTime(minDate)).getTime() + 7 * 60 * 60 * 1000;
        this.endDate = new Date(this.dateSer.getDateTime(maxDate)).getTime() + 7 * 60 * 60 * 1000;
      }
      const defaultXAxis: XAxisOptions = {
        type: "datetime",
        gridLineColor: "#2d3136",
        gridLineWidth: 0,
        labels: {
            enabled: true,
            format: "{value:%H:%M}",
            style: {
                color: "#bcd"
            },
            useHTML: true
        },
        crosshair: {
            color: "rgb(187, 204, 221)",
            dashStyle: "ShortDash"
        }
      }
      return defaultXAxis;
    }
  }

  getXAxis2options(item: XAxisOptions | undefined ){
    if(item){
      const defaultXAxis: XAxisOptions = {
        type: item.type ,
        gridLineColor: item.gridLineColor ,
        gridLineWidth: item.gridLineWidth ,
        labels: item.labels,
        lineColor: item.lineColor ,
        lineWidth: item.lineWidth ,
        tickInterval: item.tickInterval,
        categories: item.categories ,
        crosshair: item.crosshair ,
        min: item.min,
        max: item.max,
      }
      return defaultXAxis;
    } else {
      const defaultXAxis: XAxisOptions = {
        type: 'datetime',
        gridLineColor: '#2d3136',
        gridLineWidth: 1,
        labels: {
          enabled: true,
          format: '{value:%H:%M}',
        },
        //lineColor: '#2d3136',
        //lineWidth: 1,
        //categories: [],
        crosshair: true,
        //min: this.startDate,
        //max: this.endDate,
      }
      return defaultXAxis;
    }
  }

  getYAxisoptions(item: YAxisOptions[] | undefined | YAxisOptions): YAxisOptions[]{
    if(Array.isArray(item)){
      const initYAxis: YAxisOptions[] = [];
      item.forEach( i => {
        let yAxis: YAxisOptions = {
          enabled: i.enabled ,
          lineColor: i.lineColor ,
          labels: i.labels,
          lineWidth: i.lineWidth ,
          gridLineColor: i.gridLineColor ,
          gridLineWidth: i.gridLineWidth ,
          min: i.min,
          max: i.max ,
          margin: i.margin ,
          title: i.title ,
          tickInterval: i.tickInterval ,
          color: i.color ,
          categories: i.categories ,
          visible: i.visible,
          opposite: i.opposite
        }
        initYAxis.push(i);
      })
      return initYAxis;
    } else {
      const defaultYAxis: YAxisOptions[] = [];
      defaultYAxis[0] = {
        borderColor: '#2d3136',
        borderWidth: 1,
        enabled: false,
        lineColor: '#2d3136',
        labels: {
          enabled: false
        },
        lineWidth: 1,
        gridLineColor: '#2d3136',
        gridLineWidth: 1,
        min: 0,
        max: undefined,
        margin: 0,
        title: {
          text:  undefined,
          align: undefined
        },
        tickInterval: undefined,
        color: '#63C6F0',
        categories: undefined
      }
      return defaultYAxis;
    }
  }

  getLegendOptions(item: LegendOptions | undefined){
    if(item && Object.keys(item).length > 0){
      const initLegend: LegendOptions = {
        enabled: item.enabled || false,
        floating: item.floating || false,
        align: item.align || 'center',
        verticalAlign: item.verticalAlign || 'bottom',
        x: item.x || 0,
        y: item.y || 0,
        layout: item.layout || "vertical",
        itemStyle: item.itemStyle || {
          fontSize: '10px',
          fontWeight: 'bold'
        },
      } 
      return initLegend;
    } else {
      const defaultLegend: LegendOptions = {
        layout: "vertical",
        align: "right",
        verticalAlign: "top",
        floating: true,
        x: +80, // -ve = left, +ve = right
        y: -20, // -ve = up, +ve = down
        itemStyle:{
          fontWeight: 'bolder',
          fontSize: '12px'
        },
        labelFormatter: function() {
          let d:any = this.options;
          let color = d.color;
          let lastValue = 0;;
          if(d.data[d.data.length - 1] && d.data[d.data.length - 1].length > 1){
            lastValue = d.data[d.data.length - 1][1];
            lastValue = parseInt(lastValue.toFixed(0));
          }
          //let s = `<div style="margin-bottom:5px;"><div style="font-weight:500;color:#6DDBEB;"></div></div>`;
          let s = '<div class="d-flex-sb w-100 b" style="width: 80px;" ><span class="bz chart-legend" style="color:'+ color +';font-weight:500">' + this.name.split("*")[0] + '</span> <span class="bz chart-legend" style="padding-left:6px;font-weight:500;color:#bcd;"> ' + lastValue + '  ' + this.name.split("*")[1] + ' </span></div>';
          return s;
        },
        itemWidth: 150,
        useHTML: true,
        borderColor: 'red',
        symbolHeight: 0,
        symbolWidth: 0
        // borderWidth: 2,
        // backgroundColor: 'white'
      }
      return defaultLegend;
    }
  }

  getPlotOptions(item: PlotOptions | undefined){
    if(item && Object.keys(item).length > 0){
      const initPlot: PlotOptions = item;
      return initPlot;
    } else {
      const defaultPlot:PlotOptions = {
        series: {
          lineWidth: 1,
          animation: false,
          marker:{
            enabled: false
          },
          opacity: 1,
          showInLegend: true
        }
      }
      return defaultPlot;
    }
  }

  getSeriesOptions(name:string, item: SeriesOptions, data: ResponseHistorianModel | undefined){
    if(item && data){
      const series: any = {
        name: name,
        color: item.color,
        visible: item.visible || true,
        showInLegend: item.showInLegend || false,
        yAxis: item.yAxis || 0,
        fillOpacity: item.fillOpacity,
        borderColor: item.borderColor,
        borderRadius: item.borderRadius,
        borderWidth: item.borderWidth,
        data: data.records.map(function(x){
          let res:any[] = [];
          res[0] = new Date(x.TimeStamp).getTime() + 7 * 60 * 60 * 1000;
          if(!isNumber(x.Value) && x.Value.toUpperCase() == "TRUE"){
            res[1] = 1;
          } else if(!isNumber(x.Value) && x.Value.toUpperCase() == "FALSE"){
            res[1] = 0;
          } else if(!isNumber(x.Value)){
            res[1] = +(x.Value.replaceAll(",",""));
          } else {
            res[1] = x.Value;
          }
          return res;
        })
      }
      switch(item.type){
        case 'line':
          series.type = 'line';
          break;
        case 'area':
          series.type = 'area';
          break;
        case 'column':
          series.type = 'column'
          break;
        default:
          series.type = 'line';
          break;
      }
      return series;
    } else {
      const defaultSeries: any = {
        type: 'line',
        name: 'x',
        color: "#3DB1FC",
        visible: true,
        showInLegend: false,
        yAxis: 0,
        data: []
      }
      return defaultSeries;
    }
  }

  getColumnSeriesOptions(name:string, item: SeriesOptions, data: ResponseHistorianModel | undefined){
    if(item && data){
      const series: any = {
        name: name,
        color: item.color,
        visible: item.visible || true,
        showInLegend: item.showInLegend || false,
        yAxis: item.yAxis || 0,
        fillOpacity: item.fillOpacity,
        borderColor: item.borderColor,
        borderRadius: item.borderRadius,
        borderWidth: item.borderWidth,
        data: data.records.map(function(x){
          return +(x.Value);
        })
      }
      switch(item.type){
        case 'line':
          series.type = 'line';
          break;
        case 'area':
          series.type = 'area';
          break;
        case 'column':
          series.type = 'column'
          break;
        default:
          series.type = 'line';
          break;
      }
      return series;
    } else {
      const defaultSeries: any = {
        type: 'line',
        name: 'x',
        color: "#3DB1FC",
        visible: true,
        showInLegend: false,
        yAxis: 0,
        data: []
      }
      return defaultSeries;
    }
  }

  getTooltipOptions(){
    const TooltipOptions: TooltipOptions = {
      formatter: function () {
        let s = `<div style="margin-bottom:5px;"><div class="chart-tooltip" style="font-weight:500;color:#bcd;">${this.x}</div></div>`;
        s += '<table style="font-size:11px">';
        if ( this.points && this.points.length > 0) {
          this.points.forEach(p => {
              if(p.y && p.x){
                s += '<tr><td class="chart-tooltip" style="color:' + p.color + ';font-weight:500">' + p.series.name.split("_")[0] + ' :' + '</td> <td class="chart-tooltip" style="padding-left:6px;font-weight:500;color: ' + p.color + '"> ' + +(p.y).toFixed(2) + ' ' + p.series.name.split("_")[1] + ' </td></tr>';
              }
          });
        }
        s += '</table>';
        return s;
      },
      useHTML: true,
      valueDecimals: 2,
      shared: true,
      headerFormat: '',
      shadow: false,
      shape: 'rect',
      backgroundColor: '#2c3239',
      // borderColor: 'red',
      // borderRadius: 2,
      // borderWidth: 1
    }
    return TooltipOptions;
  }

  getResponsiveOptions(){
    const responsive: ResponsiveOptions = {
      rules: [{
        chartOptions: {
          chart:{
            margin: [10,100,40,100]
          },
          yAxis: [
            {
              labels: {
                step: 2,
                style: {
                  fontSize: "20px"
                }
              },
              title: {
                style: {
                  fontSize: "20px"
                }
              }
            },
            {
              labels: {
                step: 2,
                style: {
                  fontSize: "20px"
                }
              },
              title: {
                style: {
                  fontSize: "20px"
                }
              }
            }
          ],
          xAxis: [{
            labels: {
              style: {
                fontSize: "20px"
              }
            },
          }],
        },
        condition: { minWidth: 1000 },
      }, ],
    }
    return responsive;
  }
}
