import { Component, inject, input } from '@angular/core';
import { ResponseRealtimeModel } from '../../../../../../shared/models/response.model';
import { TooltipFormat } from '../../../../../../shared/services/tooltip-format';

@Component({
  selector: 'app-power-consumption',
  standalone: false,
  templateUrl: './power-consumption.html',
  styleUrl: './power-consumption.scss'
})
export class PowerConsumption {
  title = input<string>('');
  value = input<string>('');
  unit = input<string>('');
  percent = input<ResponseRealtimeModel>();

  title1 = input<string>('');
  value1 =  input<string>('');
  unit1 = input<string>('');

  title2 = input<string>('');
  value2 =  input<string>('');
  unit2 = input<string>('');

  tooltipSrv = inject(TooltipFormat);

  getPercentage(){
    let value = this.percent()?.Value??0;
    let max = this.percent()?.Max??100;
    return (value/max)*100;
  }
}
