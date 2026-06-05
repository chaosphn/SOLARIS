import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { ChartParameters } from '../../../../../../shared/models/highchart.model';
import { ChartService } from '../../../../../../shared/services/chart.service';
import { SeriesAreaOptions, SeriesColumnOptions, SeriesLineOptions, SeriesOptionsType } from 'highcharts';
import { HttpService } from '../../../../../../shared/services/http.service';
import { ResponseHistorianModel } from '../../../../../../shared/models/response.model';
import { RequestHistorianModel } from '../../../../../../shared/models/request.model';
import { EventDataModel } from '../../../../../sites/models/event.model';

@Component({
  selector: 'app-event-details',
  standalone: false,
  templateUrl: './event-details.html',
  styleUrl: './event-details.scss'
})
export class EventDetails {

  private chartOptions = inject(ChartService);
  private httpSrv = inject(HttpService);
  
  event = input<EventDataModel>();
  tagData = signal<ResponseHistorianModel[]>([]);
  chartParameter = computed(() => {
    if(this.event() && this.tagData().length > 0){
      //console.log(this.event())
      let item: ChartParameters = {};
      let series: SeriesOptionsType[] | SeriesLineOptions[] | SeriesAreaOptions[] | SeriesColumnOptions[] = this.createEventChartSeries(this.tagData()); 
      item.chart = this.chartOptions.getChartOptions({});
      item.title = this.chartOptions.getTitleOptions({});
      item.xAxis = this.chartOptions.getXAxisoptions({});
      item.xAxis =  {
        ...item.xAxis,
        plotLines: [
          {
            value: new Date(this.event()?.StartTime || 0).getTime() + (7 * 60 * 60 * 1000), // จุดที่อยาก mark
            color: '#ff0000',
            width: 2,
            dashStyle: 'Dash',
            // label: {
            //   text: 'Start Event',
            //   rotation: 0,
            //   y: -10
            // },
            zIndex: 5
          },
          ...(this.event()?.EndTime ? [{
            value: new Date(this.event()?.EndTime || 0).getTime() + (7 * 60 * 60 * 1000),
            color: '#ff0000',
            width: 2,
            // label: {
            //   text: 'End Event'
            // },
            zIndex: 5
          }] : [])
        ]
      }
      item.yAxis = this.chartOptions.getYAxisoptions({});
      item.plotOptions = this.chartOptions.getPlotOptions({});
      item.series = series;
      return item;
    } else {
      return {} as ChartParameters;
    }
  });
  colorList: string[] = [
    '#15BBC2', '#278EFF', '#9945F5', '#F143AA', '#FF9059'
    ,'#F7F156', '#B2F76D', '#17A8EB', '#6766FF', '#C437D6'
    ,'#E95967', '#15BBC2', '#278EFF', '#9945F5', '#F143AA', '#FF9059'
    ,'#F7F156', '#B2F76D', '#17A8EB', '#6766FF', '#C437D6'
    ,'#E95967','#15BBC2', '#278EFF', '#9945F5', '#F143AA', '#FF9059'
    ,'#F7F156', '#B2F76D', '#17A8EB', '#6766FF', '#C437D6'
    ,'#E95967'
  ];

  parseTagNamesAdvanced = (expression: string) => {
    if (!expression || typeof expression !== 'string') {
      return [];
    }

    const tagNames: string[] = [];

    // Patterns for different tag formats:
    const patterns = [
      // ATTIME('TAG.NAME','NOW') - for time-based functions
      /ATTIME\s*\(\s*['"]([^'"]+)['"]/gi,

      // General quoted tag names with dot notation
      /['"]([A-Z_][A-Z0-9_]*\.[A-Z0-9_.]+)['"]/gi,

      // Function calls with tag parameters
      /\w+\s*\(\s*['"]([^'"]+\.[^'"]*)['"]/gi,

      // Tag references in conditions
      /\b['"]([A-Z_][A-Z0-9_]*\.[A-Z0-9_.]*)['"]\b/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(expression)) !== null) {
        const tagName = match[1];

        // Skip common keywords
        const keywords = ['NOW', 'TRUE', 'FALSE', 'NULL', 'UNDEFINED', 'ON', 'OFF'];
        if (!keywords.includes(tagName.toUpperCase())) {
          // Check if it looks like a valid tag (contains dot and alphanumeric)
          if (tagName.includes('.') && /[A-Z0-9]/i.test(tagName)) {
            if (!tagNames.includes(tagName)) {
              tagNames.push(tagName);
            }
          }
        }
      }
    });

    return tagNames;
  };

  constructor(){
    effect(() => {
      if(this.event()){
        const tagNames = this.parseTagNamesAdvanced(this.event()!.Condition);
        //console.log('Extracted Tag Names:', tagNames);
        if(tagNames.length > 0){
          this.getTagData(tagNames);
        }
      }
    });
  }

  async getTagData(tagNames: string[]) {
    const start = new Date(this.event()?.StartTime || Date.now()); // Default to 1 hour ago
    const end = new Date(this.event()?.EndTime || Date.now()); // Default to now
    const requests: RequestHistorianModel[] = tagNames.map(tag => {
      return {
        Name: tag,
        Options: {
          Time: '',
          StartTime: new Date(start.getTime() - 30 * 60 * 1000).toISOString(), // 1 hour ago
          EndTime: this.event()?.EndTime ? new Date(end.getTime() + 30 * 60 * 1000).toISOString() : new Date().toISOString()
        }
      }
    })
    const result = await this.httpSrv.getHistorian(requests);
    if(result){
      this.tagData.set(result);
    } else {
      this.tagData.set([]);
    }
  };

  createEventChartSeries(data: ResponseHistorianModel[]) {
    const series: SeriesLineOptions[] = data.map((item, index) => {
      const points = item.records.map(value => {
        return [new Date(value.TimeStamp).getTime() + 7 * 60 * 60 * 1000, parseFloat(value.Value)];
      });
      return {
        type: 'line',
        name: item.Name,
        data: points,
        color: this.colorList[index % this.colorList.length],
        showInLegend: true, 
        marker: {
          enabled: true,
          radius: 3
        }
      } as SeriesLineOptions;
    });
    return series;
  }

  parseExpression(expression: string | undefined){
    if (!expression || typeof expression !== 'string') {
      return '';
    }

    let tagName: string = expression;
    const normalize = (s: any) => s.replace(/\s+/g, '');
    const matches = [...expression.matchAll(/\b(ATTIME|REAL|MAX|MIN|SUM|AVG|LAST|TIMESTAMP)\s*\(([^()]*)\)/g)];
    const uniqueMatches = [
        ...new Map(
            matches.map(m => [normalize(m[0]), m])
        ).values()
    ];
    uniqueMatches.map(x => {
      const expr = x[0];
      const tag = x[2];
      tagName = tagName.replaceAll(expr, tag);
    });
    return tagName;
  }


}
