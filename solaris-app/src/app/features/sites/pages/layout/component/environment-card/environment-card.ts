import { Component, input } from '@angular/core';
import { ResponseRealtimeModel } from '../../../../../../shared/models/response.model';

@Component({
  selector: 'app-environment-card',
  standalone: false,
  templateUrl: './environment-card.html',
  styleUrl: './environment-card.scss'
})
export class EnvironmentCard {
  title1 = input<string>('');
  title2 = input<string>('');
  title3 = input<string>('');
  title4 = input<string>('');
  title5 = input<string>('');
  title6 = input<string>('');
  item1 = input<ResponseRealtimeModel>();
  item2 = input<ResponseRealtimeModel>();
  item3 = input<ResponseRealtimeModel>();
  item4 = input<ResponseRealtimeModel>();
  item5 = input<ResponseRealtimeModel>();
  item6 = input<ResponseRealtimeModel>();
}
