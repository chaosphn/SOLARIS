import { Component, input } from '@angular/core';

@Component({
  selector: 'app-no-data',
  standalone: false,
  templateUrl: './no-data.html',
  styleUrl: './no-data.scss'
})
export class NoData {
  message = input<string>('No Data');
  hint = input<string>('');
  icon = input<string>('insights');
}
