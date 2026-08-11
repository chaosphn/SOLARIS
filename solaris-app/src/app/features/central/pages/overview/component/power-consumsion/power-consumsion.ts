import { Component, inject, input, Input } from '@angular/core';
import { ResponseRealtimeModel } from '../../../../../../shared/models/response.model';
import { TooltipFormat } from '../../../../../../shared/services/tooltip-format';

@Component({
  selector: 'app-power-consumsion',
  standalone: false,
  templateUrl: './power-consumsion.html',
  styleUrl: './power-consumsion.scss'
})
export class PowerConsumsion {
  @Input() tagName: string = '';
  @Input() timestamp: string = '';

  tooltipSrv = inject(TooltipFormat);

  performance = input<ResponseRealtimeModel>();
  yield = input<ResponseRealtimeModel>();
  capacity = input<ResponseRealtimeModel>();
  power = input<ResponseRealtimeModel>();
  /** พลังงานสะสมของวัน — ค่าหลักที่แสดงในวงกลม */
  energy = input<ResponseRealtimeModel>();
  /** พลังงานที่ควรได้ของวัน ใช้เป็นฐานคำนวณ % */
  expected = input<ResponseRealtimeModel>();

  getPercentage(){
    const value = this.energy()?.Value ?? 0;
    const target = this.energy()?.Max ?? this.expected()?.Value ?? 0;
    if(!target){
      return 0;
    }
    return (value / target) * 100;
  }
}
