import { Component, computed, inject, input, signal } from '@angular/core';
import { PlantStatusData } from '../../../../../../shared/components/piechart/piechart';
import { ChartParameters } from '../../../../../../shared/models/highchart.model';
import { ChartService } from '../../../../../../shared/services/chart.service';
import { SeriesAreaOptions, SeriesColumnOptions, SeriesLineOptions, SeriesOptionsType } from 'highcharts/highcharts';

@Component({
  selector: 'app-event-consumption',
  standalone: false,
  templateUrl: './event-consumption.html',
  styleUrl: './event-consumption.scss'
})
export class EventConsumption {

  private chartOptions = inject(ChartService);

  colorList: string[] = [
    '#15BBC2', '#278EFF', '#9945F5', '#F143AA', '#FF9059'
    ,'#F7F156', '#B2F76D', '#17A8EB', '#6766FF', '#C437D6'
    ,'#E95967', '#15BBC2', '#278EFF', '#9945F5', '#F143AA', '#FF9059'
    ,'#F7F156', '#B2F76D', '#17A8EB', '#6766FF', '#C437D6'
    ,'#E95967','#15BBC2', '#278EFF', '#9945F5', '#F143AA', '#FF9059'
    ,'#F7F156', '#B2F76D', '#17A8EB', '#6766FF', '#C437D6'
    ,'#E95967'
  ];
  events = input<any[]>([]);
  eventCount = computed(() => {
    if(this.events()){
      return this.events().filter(x => x.type === 'event').length;
    } else {
      return 0;
    }
  });
  warnCount = computed(() => {
    if(this.events()){
      return this.events().filter(x => x.type === 'warning').length;
    } else {
      return 0;
    }
  });
  minorCount = computed(() => {
    if(this.events()){
      return this.events().filter(x => x.type === 'minor').length;
    } else {
      return 0;
    }
  });
  majorCount = computed(() => {
    if(this.events()){
      return this.events().filter(x => x.type === 'major').length;
    } else {
      return 0;
    }
  });
  plantStatusData = computed(() => {
    if(this.events()){
      return this.events().reduce((acc, cur, index) => {
        const findEqp = acc.find((x: any) => x.label == cur.asset);
        if(!findEqp){
          const count = this.events().filter(x => x.asset == cur.asset).length;
          const percentage = (count/this.events().length)*100;
          acc.push({ label: cur.asset, count: count, percentage: percentage, color: this.colorList[index], unit: 'Unit' });
        }
        return acc;
      }, [] as PlantStatusData[]);
    } else {
      return [];
    }
  });
  chartParameter = computed(() => {
    if(this.events()){
      let item: ChartParameters = {};
      let series: SeriesOptionsType[] | SeriesLineOptions[] | SeriesAreaOptions[] | SeriesColumnOptions[] = this.createEventChartSeries(this.events()); 
      item.chart = this.chartOptions.getChartOptions({});
      item.title = this.chartOptions.getTitleOptions({});
      item.xAxis = this.chartOptions.getXAxisoptions({});
      item.yAxis = this.chartOptions.getYAxisoptions({});
      item.plotOptions = this.chartOptions.getPlotOptions({});
      item.series = series;
      return item;
    } else {
      return {} as ChartParameters;
    }
  });

  // ฟังก์ชันสำหรับแปลงข้อมูล events เป็น chart series
  createEventChartSeries(events: any[]) {
    // จัดกลุ่มข้อมูลตาม type
    const typeGroups = {
      event: [] as [number, number][],
      warning: [] as [number, number][],
      minor: [] as [number, number][],
      major: [] as [number, number][]
    };

    // นับจำนวนสะสมของแต่ละ type
    const counters = {
      event: 0,
      warning: 0,
      minor: 0,
      major: 0
    };

    // เรียงข้อมูลตามเวลา
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // วนลูปและสร้างข้อมูลสำหรับแต่ละจุด
    sortedEvents.forEach(event => {
      const timestamp = new Date(event.timestamp).getTime();
      const type = event.type as keyof typeof counters;
      
      // เพิ่มจำนวนสะสมของ type นั้น
      counters[type]++;
      
      // เพิ่มข้อมูลจุดใหม่สำหรับทุก type (เพื่อให้เส้นกราฟต่อเนื่อง)
      typeGroups.event.push([timestamp, counters.event]);
      typeGroups.warning.push([timestamp, counters.warning]);
      typeGroups.minor.push([timestamp, counters.minor]);
      typeGroups.major.push([timestamp, counters.major]);
    });

    // สร้าง series สำหรับแต่ละ type
    const series: SeriesLineOptions[] = [
      {
        type: 'line',
        name: 'Event*events',
        data: typeGroups.event,
        color: '#10FDD3',
        showInLegend: false,
        marker: {
          enabled: true,
          radius: 3
        }
      },
      {
        type: 'line',
        name: 'Warning*events',
        data: typeGroups.warning,
        color: '#ffe348',
        showInLegend: false,
        marker: {
          enabled: true,
          radius: 3
        }
      },
      {
        type: 'line',
        name: 'Minor*events',
        data: typeGroups.minor,
        color: 'tomato',
        showInLegend: false,
        marker: {
          enabled: true,
          radius: 3
        }
      },
      {
        type: 'line',
        name: 'Major*events',
        data: typeGroups.major,
        color: 'crimson',
        showInLegend: false,
        marker: {
          enabled: true,
          radius: 3
        }
      }
    ];

    return series;
  }

}
