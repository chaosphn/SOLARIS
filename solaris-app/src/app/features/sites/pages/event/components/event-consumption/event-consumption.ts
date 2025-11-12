import { Component, computed } from '@angular/core';
import { PlantStatusData } from '../../../../../../shared/components/piechart/piechart';

@Component({
  selector: 'app-event-consumption',
  standalone: false,
  templateUrl: './event-consumption.html',
  styleUrl: './event-consumption.scss'
})
export class EventConsumption {

  plantStatusData = computed(() => {
    const data: PlantStatusData[] = [
      { label: 'INVERTERS', count: 35, percentage: 15, color: '#10FDD3', unit: 'Unit' },
      { label: 'POWER MERTERS', count: 105, percentage: 45, color: '#DEB266', unit: 'Unit' },
      { label: 'WEATHER STATION', count: 50, percentage: 40, color: '#FF4F52', unit: 'Unit' }
    ];
    return data;
  });

}
