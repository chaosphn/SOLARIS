import { Component, computed, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { ResponseRealtimeModel } from '../../../../../../shared/models/response.model';
import { TooltipFormat } from '../../../../../../shared/services/tooltip-format';

@Component({
  selector: 'app-financial-summary',
  standalone: false,
  templateUrl: './financial-summary.html',
  styleUrl: './financial-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinancialSummary {
  /** energy today (kWh) */
  today = input<ResponseRealtimeModel>();
  /** energy month-to-date (kWh) */
  month = input<ResponseRealtimeModel>();
  /** expected/target energy month-to-date (kWh) — used for PPA target */
  target = input<ResponseRealtimeModel>();
  /** energy tariff (฿/kWh) — revenue is estimated from this */
  tariff = input<number>(3.85);

  tooltipSrv = inject(TooltipFormat);

  /** revenue today (฿) */
  revenueToday = computed(() => (this.today()?.Value ?? 0) * this.tariff());
  /** revenue month-to-date (฿) */
  revenueMonth = computed(() => (this.month()?.Value ?? 0) * this.tariff());
  /** annual revenue estimate (฿), projected from MTD revenue */
  annualEstimate = computed(() => this.revenueMonth() * 12);

  /** progress of MTD revenue vs PPA target (0-100) */
  ppaPercent = computed(() => {
    const cur = this.month()?.Value ?? 0;
    const tgt = this.target()?.Value ?? 0;
    if (!tgt) {
      return 0;
    }
    return Math.min((cur / tgt) * 100, 100);
  });

  /** signed diff of MTD revenue vs PPA target (%) */
  ppaDiff = computed(() => {
    const cur = this.month()?.Value ?? 0;
    const tgt = this.target()?.Value ?? 0;
    if (!tgt) {
      return 0;
    }
    return ((cur - tgt) / tgt) * 100;
  });

  /** convert a raw ฿ value to millions for display */
  toMillion(value: number): number {
    return value / 1_000_000;
  }
}
