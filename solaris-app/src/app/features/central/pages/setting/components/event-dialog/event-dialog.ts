import { Component, input, OnInit, output } from '@angular/core';
import { AlarmTag, NotificationConfig } from '../../../../models/billing.model';

@Component({
  selector: 'app-event-dialog',
  standalone: false,
  templateUrl: './event-dialog.html',
  styleUrl: './event-dialog.scss'
})
export class EventDialog {

  alarmData = input<AlarmTag>(this.getEmptyAlarmTag());
  onClose = output();

  private nextAlarmId: number = 1;

  // Alarm Management Methods
  getEmptyAlarmTag(): AlarmTag {
    return {
      id: 0,
      name: '',
      description: '',
      message: '',
      expression: '',
      tagSync: '',
      destination: {
        telegram: false,
        msteam: false,
        email: false
      }
    };
  }

  closeAlarmModal(): void {
    this.onClose.emit();
  }

  saveNewAlarm(): void {
    if (!this.alarmData().name.trim()) {
      alert('Please enter alarm name');
      return;
    }

    this.closeAlarmModal();
  }

  
}
