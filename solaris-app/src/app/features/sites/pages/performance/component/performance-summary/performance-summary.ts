import { Component, input } from '@angular/core';
import { ResponseRealtimeModel } from '../../../../../../shared/models/response.model';


@Component({
  selector: 'app-performance-summary',
  standalone: false,
  templateUrl: './performance-summary.html',
  styleUrl: './performance-summary.scss'
})
export class PerformanceSummary {
  title = input<string>('');
  value = input<string>('');
  unit = input<string>('');
  percent = input<ResponseRealtimeModel>();

  title1 = input<string>('');
  value1 = input<string>('');
  unit1 = input<string>('');

  title11 = input<string>('');
  value11 = input<string>('');
  unit11 = input<string>('');

  title2 = input<string>('');
  value2 = input<string>('');
  unit2 = input<string>('');
  
  title21 = input<string>('');
  value21 = input<string>('');
  unit21 = input<string>('');

  getPercentage(){
    let value = this.percent()?.Value??0;
    let max = this.percent()?.Max??100;
    return (value/max)*100;
  }
}
