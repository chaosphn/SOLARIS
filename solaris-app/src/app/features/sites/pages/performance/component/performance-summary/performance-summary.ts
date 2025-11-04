import { Component, inject, input } from '@angular/core';
import { ResponseRealtimeModel } from '../../../../../../shared/models/response.model';
import { TooltipFormat } from '../../../../../../shared/services/tooltip-format';


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
  value1 = input<ResponseRealtimeModel>();
  unit1 = input<string>('');

  title11 = input<string>('');
  value11 = input<ResponseRealtimeModel>();
  unit11 = input<string>('');

  title2 = input<string>('');
  value2 = input<ResponseRealtimeModel>();
  unit2 = input<string>('');
  
  title21 = input<string>('');
  value21 = input<ResponseRealtimeModel>();
  unit21 = input<string>('');

  tooltipSrv = inject(TooltipFormat);

  getPercentage(){
    let value = this.percent()?.Value??0;
    let max = this.percent()?.Max??100;
    return (value/max)*100;
  }
}
