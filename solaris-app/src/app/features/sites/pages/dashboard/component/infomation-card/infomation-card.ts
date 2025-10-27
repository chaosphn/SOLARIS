import { Component, input } from '@angular/core';

@Component({
  selector: 'app-infomation-card',
  standalone: false,
  templateUrl: './infomation-card.html',
  styleUrl: './infomation-card.scss'
})
export class InfomationCard {
  site = input<string>('---');
  location = input<string>('---');
  capacity = input<string>('---');
  cod = input<string>('---');
}
