import { ChangeDetectionStrategy, Component, effect, ElementRef, inject, input, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { ChartModule } from 'angular-highcharts';
import { Chart } from 'angular-highcharts';
import { Series, SeriesOptionsType } from 'highcharts';
import { splitNsName } from '@angular/compiler';
import { isDate } from 'moment';
import { ChartParameters } from '../../models/highchart.model';
import { Datetime } from '../../services/datetime';

@Component({
  selector: 'app-highchart',
  standalone: false,
  templateUrl: './highchart.html',
  styleUrl: './highchart.scss'
})
export class Highchart  {
  
  chart?: Chart;
  ref?: Highcharts.Chart;
  chartParameter = input.required<ChartParameters>({});
  today = new Date(new Date().setHours(23,59,0,0)).getTime() + 7 * 60 * 60 * 1000;
  yester = new Date(new Date().setHours(0,0,0,0)).getTime() + 7 * 60 * 60 * 1000;

  private dateTimeSrv = inject(Datetime);
  constructor() {
    effect(() => {
      if( this.chartParameter() && this.chartParameter()?.series && this.chartParameter()?.yAxis != undefined  && this.chartParameter()?.chart && this.chartParameter()?.xAxis ){
        this.init();
      } else {
        this.chart = undefined;
      }
    });
  }

  addPoint() {
    if (this.chart) {
      this.chart.addPoint(Math.floor(Math.random() * 10), 0, false);
    } else {
      alert('init chart, first!');
    }
  }

  addSerie() {
    this.chart?.addSeries({
      type: 'line',
      name: 'Line ' + Math.floor(Math.random() * 10),
      data: [
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10)
      ]
    }, false, false);
  }

  removePoint() {
    if (this.ref) {
      this.chart?.removePoint(this.ref.series[0].data.length - 1);
    }
  }

  removeSerie() {
    if (this.ref) {
      this.chart?.removeSeries(this.ref?.series.length - 1);
    }
  }

  splitName(txt: string, idx: number){
    const name = txt.split("_")[idx];
    if(name){
      return name;
    } else {
      return "-";
    }
  }

  init() {
    let chart = new Chart({
      chart: this.chartParameter()?.chart,
      title: {
        text: undefined,
        style: this.chartParameter()?.title?.style,
        align: this.chartParameter()?.title?.align,
        floating: this.chartParameter()?.title?.floating,
        margin: this.chartParameter()?.title?.margin
      },
      credits: {
        enabled: false
      },
      legend: this.chartParameter()?.legend || {
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
          let s: any = '<div class="d-flex-sb w-100 b" style="width: 80px;" ><span class="bz" style="color:'+ color +';font-weight:500">' + this.name.split("*")[0] + '</span> <span class="bz" style="padding-left:6px;font-weight:500;color:#bcd;"> ' + lastValue + '  ' + this.name.split("*")[1] + ' </span></div>';
          return s;
        },
        itemWidth: 150,
        useHTML: true,
        borderColor: 'red',
        symbolHeight: 0,
        symbolWidth: 0
        // borderWidth: 2,
        // backgroundColor: 'white'
      },
      xAxis: this.chartParameter()?.xAxis,
      yAxis: this.chartParameter()?.yAxis,
      series: this.chartParameter()?.series, 
      tooltip: this.chartParameter()?.tooltip || {
        formatter: function () {
          let dateTime: Date = new Date();
          if(this.x){
            dateTime = new Date(this.x);
          }
          let dt = new DateTime();
          let montnFormat = dt.getMonth(dateTime.getMonth());
          // d-MMM-yy
          let dateFormat = ('0' + dateTime.getDate()).slice(-2);
          let yearFormat = ('0' + dateTime.getFullYear()).slice(-2);
          let hourFormat = ((dateTime.getHours()-7));
          let minFormat = ('0' +dateTime.getMinutes()).slice(-2);
          let timeStamp = (dateTime.getFullYear() > 1500) ? `${dateFormat}-${montnFormat}-${yearFormat} ${hourFormat}:${minFormat}` : '';
          let ts = isDate(dateTime) ? dateTime.toISOString().slice(0,16).replace("T"," ") : '---';
          let s = `<div class="chart-tooltip" style="margin-bottom:5px;"><div style="font-weight:500;color:#bcd;">${ts}</div></div>`;
          s += '<table style="font-size:11px">';
          if ( this.points && this.points.length > 0) {
            this.points.forEach(p => {
              let unit = p.series.name.split("*")[1]??'';
              if(dateTime.toString() == 'Invalid Date' || dateTime.getFullYear() < 2000 || dateTime.getFullYear() > 3000)
              { 
                if(p.y && p.x){
                  s += '<tr><td class="chart-tooltip" style="color:' + p.color + ';font-weight:500">' + p.x + '</td> <td class="chart-tooltip" style="padding-left:6px;font-weight:500;color: ' + p.color + '"> ' + +(p.y).toFixed(2) + '</td></tr>';
                }
              }
              else{
                if(p.y && p.x){
                  s += '<tr><td class="chart-tooltip" style="color:' + p.color + ';font-weight:500">' + p.series.name.split("*")[0] + ' :' + '</td> <td class="chart-tooltip" style="padding-left:6px;font-weight:500;color: ' + p.color + '"> ' +(p.y).toFixed(2) + ' ' + unit + ' </td></tr>';
                }
              }
              //s += '<tr><td style="color:rgba(0, 0, 0, 0.9);font-weight:500">' + p.series.name + '</td> <td style="padding-left:12px;font-weight:bold;color: ' + p.color + '"> ' + +(p.y).toFixed(2) + '</td></tr>';
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
        backgroundColor: '#1C2125',
        // borderColor: 'red',
        // borderRadius: 2,
        // borderWidth: 1
      },
      plotOptions: this.chartParameter()?.plotOptions,
      responsive: this.chartParameter()?.responsive || {},
    });
    ////console.log(chart)
    // chart.addPoint(4, 0, false);
    this.chart = chart;
    // chart.addPoint(5, 0, false);
    if (this.chart && this.chart.ref$) {
      this.chart.ref$.subscribe(ref => {
        this.ref = ref;
      });
    }
    // setTimeout(() => {
    //   chart.addPoint(6, 0, false);
    // }, 2000);

    //chart.ref$.subscribe(//console.log);
  }

}

export class DateTime {
  constructor() { }

  getMonth(index: number) {
    const month = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return month[index];
  }
}

export interface ChartData{
  Timestamp:string;
  Value:string;
}
