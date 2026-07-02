import { Component, input, signal } from '@angular/core';
import { DataRealtimeModel, ResponseRealtimeModel } from '../../../../../../shared/models/response.model';
import { ChartParameters } from '../../../../../../shared/models/highchart.model';

@Component({
  selector: 'app-energy-consumption',
  standalone: false,
  templateUrl: './energy-consumption.html',
  styleUrl: './energy-consumption.scss'
})
export class EnergyConsumption {
  today = input<ResponseRealtimeModel>();
  month = input<ResponseRealtimeModel>();
  year = input<ResponseRealtimeModel>();
  total = input<ResponseRealtimeModel>();
  today_expect = input<ResponseRealtimeModel>();
  month_expect = input<ResponseRealtimeModel>();
  year_expect = input<ResponseRealtimeModel>();

  chartData = input<ChartParameters>({} as ChartParameters);

  getTooltip(data: ResponseRealtimeModel | undefined): string {
    const name = data?.Name || '';
    const time = data?.TimeStamp || '';
    if (name && time) { return `${name} • ${time}`; }
    return name || time || '---';
  }
}
