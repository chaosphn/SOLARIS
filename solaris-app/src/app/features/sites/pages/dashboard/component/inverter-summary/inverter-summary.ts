import { Component, effect, input, OnInit, signal } from '@angular/core';
import { DataRealtimeModel } from '../../../../../../shared/models/response.model';

@Component({
  selector: 'app-inverter-summary',
  standalone: false,
  templateUrl: './inverter-summary.html',
  styleUrl: './inverter-summary.scss'
})
export class InverterSummary implements OnInit {
  property = input<any[]>([]);
  inverter = input<string[]>([]);
  data = input<DataRealtimeModel>({});

  selectedInverter = signal<any>({});

  constructor() {
    effect(() => {
      if (this.property().length > 0 && !this.selectedInverter().prefix) {
        this.selectedInverter.set(this.property()[0]);
      } 
    });
  }

  ngOnInit(): void {
    if (this.property().length > 0 && !this.selectedInverter()) {
        this.selectedInverter.set(this.property()[0]);
      } 
  }

  changeMode(inverterId: any) {
    this.selectedInverter.set(inverterId);
  }

}
