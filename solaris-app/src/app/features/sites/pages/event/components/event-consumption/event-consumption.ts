import { Component, computed, inject, input, signal } from '@angular/core';
import { PlantStatusData } from '../../../../../../shared/components/piechart/piechart';
import { ChartParameters } from '../../../../../../shared/models/highchart.model';
import { ChartService } from '../../../../../../shared/services/chart.service';
import { SeriesAreaOptions, SeriesColumnOptions, SeriesLineOptions, SeriesOptionsType } from 'highcharts';
import { EventDataModel } from '../../../../models/event.model';

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
  events = input<EventDataModel[]>([]);
  eventCount = computed(() => {
    if(this.events()){
      return this.events().filter(x => x.Level === 'Info').length;
    } else {
      return 0;
    }
  });
  warnCount = computed(() => {
    if(this.events()){
      return this.events().filter(x => x.Level === 'Warning').length;
    } else {
      return 0;
    }
  });
  minorCount = computed(() => {
    if(this.events()){
      return this.events().filter(x => x.Level === 'Minor').length;
    } else {
      return 0;
    }
  });
  majorCount = computed(() => {
    if(this.events()){
      return this.events().filter(x => x.Level === 'Major').length;
    } else {
      return 0;
    }
  });
  plantStatusData = computed(() => {
    if(this.events()){
      return this.events().reduce((acc, cur, index) => {
        const findEqp = acc.find((x: any) => x.label == cur.Item);
        if(!findEqp){
          const count = this.events().filter(x => x.Item == cur.Item).length;
          const percentage = (count/this.events().length)*100;
          acc.push({ label: cur.Item, count: count, percentage: percentage, color: this.colorList[index], unit: 'Unit' });
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
      Info: [] as [number, number][],
      Warning: [] as [number, number][],
      Minor: [] as [number, number][],
      Major: [] as [number, number][]
    };

    // นับจำนวนสะสมของแต่ละ type
    const counters = {
      Info: 0,
      Warning: 0,
      Minor: 0,
      Major: 0
    };

    // เรียงข้อมูลตามเวลา
    const sortedEvents: EventDataModel[] = [...events].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // วนลูปและสร้างข้อมูลสำหรับแต่ละจุด
    sortedEvents.forEach(event => {
      const timestamp = new Date(event.StartTime).getTime() + 7 * 60 * 60 * 1000; // ปรับเวลาเป็น UTC+7
      const type = event.Level as keyof typeof counters;
      
      // เพิ่มจำนวนสะสมของ type นั้น
      counters[type]++;
      
      // เพิ่มข้อมูลจุดใหม่สำหรับทุก type (เพื่อให้เส้นกราฟต่อเนื่อง)
      typeGroups.Info.push([timestamp, counters.Info]);
      typeGroups.Warning.push([timestamp, counters.Warning]);
      typeGroups.Minor.push([timestamp, counters.Minor]);
      typeGroups.Major.push([timestamp, counters.Major]);
    });

    // สร้าง series สำหรับแต่ละ type
    const series: SeriesLineOptions[] = [
      {
        type: 'line',
        name: 'Event*events',
        data: typeGroups.Info,
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
        data: typeGroups.Warning,
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
        data: typeGroups.Minor,
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
        data: typeGroups.Major,
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
