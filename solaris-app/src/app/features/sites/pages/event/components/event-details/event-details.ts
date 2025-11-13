import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-event-details',
  standalone: false,
  templateUrl: './event-details.html',
  styleUrl: './event-details.scss'
})
export class EventDetails {
  event = input<any>();
}
