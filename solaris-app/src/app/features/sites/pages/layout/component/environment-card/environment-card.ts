import { Component, computed, input } from '@angular/core';
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

  /**
   * tag CO₂ ส่งค่ามาเป็น "กิโลกรัม" — แปลงเป็น ton และขยับเป็น k-ton เมื่อค่าสะสมโตพอ
   * เพื่อไม่ให้ตัวเลขยาวเกินอ่านบนการ์ด
   */
  co2 = computed<{ value: number | null; unit: string }>(() => {
    const kg = this.item6()?.Value;
    if (kg === null || kg === undefined || kg === '') {
      return { value: null, unit: 'tCO₂' };
    }
    const num = Number(kg);
    if (!Number.isFinite(num)) {
      return { value: null, unit: 'tCO₂' };
    }
    const ton = num / 1000;
    return Math.abs(ton) >= 1000
      ? { value: ton / 1000, unit: 'ktCO₂' }
      : { value: ton, unit: 'tCO₂' };
  });
}
