import { Component, inject, input, Input } from '@angular/core';
import { ResponseRealtimeModel } from '../../../../../../shared/models/response.model';
import { TooltipFormat } from '../../../../../../shared/services/tooltip-format';

@Component({
  selector: 'app-power-consumsion',
  standalone: false,
  templateUrl: './power-consumsion.html',
  styleUrl: './power-consumsion.scss'
})
export class PowerConsumsion {
  @Input() tagName: string = '';
  @Input() timestamp: string = '';

  tooltipSrv = inject(TooltipFormat);

  performance = input<ResponseRealtimeModel>();
  yield = input<ResponseRealtimeModel>();
  capacity = input<ResponseRealtimeModel>();
  power = input<ResponseRealtimeModel>();

  getPercentage(){
    let value = this.power()?.Value??0;
    let max = this.power()?.Max??100;
    return (value/max)*100;
  }
}
