import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Datetime } from '../../services/datetime';


@Component({
  selector: 'app-date-picker',
  templateUrl: './date-picker.html',
  styleUrl: './date-picker.scss',
  standalone: false
})
export class DatePickers implements OnInit, OnChanges {
  
  @Input({ required: true }) initdate: Date = new Date();
  @Input() type: 'day' | 'datetime' | 'month' | 'year' = 'day';
  @Input() scale: number = 1;
  @Output() selectDate = new EventEmitter<Date>();

  selectedDate: Date = new Date();
  uniqueId: string = '';
  private dateTimeSrv = inject(Datetime);

  ngOnChanges(changes: SimpleChanges): void {
    console.log(this.initdate)
    this.selectedDate = this.initdate;
  }

  ngOnInit(): void {
    this.selectedDate = this.initdate;
    this.uniqueId = `datepicker-${Math.random().toString(36).substr(2, 9)}`;
  }

  onDateSelect(event: any) {
    console.log('Date selected:', event);
    this.selectDate.emit(event);
    
  }
}
