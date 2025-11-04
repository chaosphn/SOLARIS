import { Component, inject, input } from '@angular/core';
import { ResponseRealtimeModel } from '../../../../../../shared/models/response.model';
import { ChartParameters } from '../../../../../../shared/models/highchart.model';
import { TooltipFormat } from '../../../../../../shared/services/tooltip-format';

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

  tooltipSrv = inject(TooltipFormat);
  
}
