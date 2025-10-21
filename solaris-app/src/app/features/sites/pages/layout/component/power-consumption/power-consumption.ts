import { Component, input } from '@angular/core';
import { ResponseRealtimeModel } from '../../../../../../shared/models/response.model';
import { ChartParameters } from '../../../../../../shared/models/highchart.model';

@Component({
  selector: 'app-power-consumption',
  standalone: false,
  templateUrl: './power-consumption.html',
  styleUrl: './power-consumption.scss'
})
export class PowerConsumption {
  power = input<ResponseRealtimeModel>();
  energy = input<ResponseRealtimeModel>();
  yield = input<ResponseRealtimeModel>();
  performance = input<ResponseRealtimeModel>();
  chart = input<ChartParameters>({} as ChartParameters);
}
