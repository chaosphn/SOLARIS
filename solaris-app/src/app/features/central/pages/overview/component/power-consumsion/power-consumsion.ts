import { Component, input, Input } from '@angular/core';
import { ResponseRealtimeModel } from '../../../../../../shared/models/response.model';

@Component({
  selector: 'app-power-consumsion',
  standalone: false,
  templateUrl: './power-consumsion.html',
  styleUrl: './power-consumsion.scss'
})
export class PowerConsumsion {
  @Input() tagName: string = '';
  @Input() timestamp: string = '';

  performance = input<ResponseRealtimeModel>();
  yield = input<ResponseRealtimeModel>();
  capacity = input<ResponseRealtimeModel>();
  power = input<ResponseRealtimeModel>();

  getPercentage(){
    let value = this.power()?.Value??0;
    let max = this.power()?.Max??100;
    return (value/max)*100;
  }

  getTooltip(data: ResponseRealtimeModel | undefined): string {
    const name = data?.Name || '';
    const time = data?.TimeStamp || '';
    if (name && time) { return `${name} • ${time}`; }
    return name || time || '---';
  }
}
