import { Component, inject, input } from '@angular/core';
import { ResponseRealtimeModel } from '../../../../../../shared/models/response.model';
import { TooltipFormat } from '../../../../../../shared/services/tooltip-format';

@Component({
  selector: 'app-weather-station',
  standalone: false,
  templateUrl: './weather-station.html',
  styleUrl: './weather-station.scss'
})
export class WeatherStation {
  icon1 = input<string>('');
  data1 = input<ResponseRealtimeModel>();
  color1 = input<string>('');
  icon2 = input<string>('');
  data2 = input<ResponseRealtimeModel>();
  color2 = input<string>('');
  icon3 = input<string>('');
  data3 = input<ResponseRealtimeModel>();
  color3 = input<string>('');
  icon4 = input<string>('');
  data4 = input<ResponseRealtimeModel>();
  color4 = input<string>('');

  title1 = input<string>('');
  value1 = input<ResponseRealtimeModel>();
  unit1 = input<string>('');

  title2 = input<string>('');
  value2 = input<ResponseRealtimeModel>();
  unit2 = input<string>('');

   tooltipSrv = inject(TooltipFormat);
}

