import { Component, input } from '@angular/core';
import { ResponseRealtimeModel } from '../../../../../../shared/models/response.model';

@Component({
  selector: 'app-environment-card',
  standalone: false,
  templateUrl: './environment-card.html',
  styleUrl: './environment-card.scss'
})
export class EnvironmentCard {
  reduction = input<ResponseRealtimeModel>();
  credit = input<ResponseRealtimeModel>();
  tree = input<ResponseRealtimeModel>();
  oil = input<ResponseRealtimeModel>();
}
