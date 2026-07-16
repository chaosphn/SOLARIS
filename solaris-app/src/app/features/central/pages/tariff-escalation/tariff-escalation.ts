import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { min, Subscription, timer } from 'rxjs';
import { SiteModel } from '../../../../shared/models/config.model';
import { PlantSlaModel } from '../../../../shared/models/masterdata.model';
import { AppInitService } from '../../../../shared/services/app-init.service';
import { ChartService } from '../../../../shared/services/chart.service';
import { ChartParameters } from '../../../../shared/models/highchart.model';
import { BillingConfigModel } from '../../models/billing.model';
import { buildTariffAnalytics, MONTH_ABBR } from '../../models/tariff-escalation.model';
import { PpaDataLoader } from '../../services/ppa-data-loader';
import { selectPpaSiteList, selectPpaBillingConfigs, selectPpaSlaByYear } from '../../store/selectors/ppa.selector';

const C_YELLOW = '#FBE134';
const C_GREEN = '#4CAF82';
const C_GRID = 'var(--chart-brd)';
const PERIOD_YEARS = 5;   // ขนาด block ของ Revenue per period

@Component({
  selector: 'app-tariff-escalation',
  standalone: false,
  templateUrl: './tariff-escalation.html',
  styleUrl: './tariff-escalation.scss',
})
export class TariffEscalation implements OnInit, OnDestroy {

  private store = inject(Store);
  private ppaLoader = inject(PpaDataLoader);
  private appInit = inject(AppInitService);
  private chartSrv = inject(ChartService);

  siteList = toSignal(this.store.select(selectPpaSiteList), { initialValue: [] as SiteModel[] });
  billingConfigs = toSignal(this.store.select(selectPpaBillingConfigs), { initialValue: [] as BillingConfigModel[] });
  slaByYear = toSignal(this.store.select(selectPpaSlaByYear), { initialValue: {} as Record<string, Record<number, PlantSlaModel>> });
  loading = signal<boolean>(true);

  timers?: Subscription;
  date: Date = new Date();

  analytics = computed(() => buildTariffAnalytics(
    this.siteList(), this.billingConfigs(), this.slaByYear(), this.date, PERIOD_YEARS
  ));

  // ───────── Highcharts ─────────
  stepCurveChart = computed<ChartParameters>(() => {
    const a = this.analytics();
    const cur = a.curYear;
    const r2 = (v: number | null) => v == null ? null : Math.round(v * 100) / 100;
    return this.baseChart(
      a.years.map(String),
      [
        {
          type: 'line', name: 'Blended (past)', color: C_YELLOW, step: 'left',
          data: a.blendedByYear.map((v, i) => i == 0 ? r2(v) : a.years[i-1] <= cur ? r2(v) : null),
          marker: { enabled: false }, lineWidth: 2.5
        },
        {
          type: 'line', name: 'Blended (future)', color: C_YELLOW, step: 'left', dashStyle: 'Dash',
          data: a.blendedByYear.map((v, i) => a.years[i] > cur ? r2(v) : null),
          marker: { enabled: false }, lineWidth: 2.5, opacity: 0.85
        }
      ] as any,
      { series: { animation: false } }, 2
    );
  });

  revenuePeriodChart = computed<ChartParameters>(() => {
    const a = this.analytics();
    const toM = (v: number) => Math.round(v / 1e6);
    return this.baseChart(
      a.revenuePeriods.map(p => p.label),
      [
        { type: 'column', name: 'Revenue (฿M)', color: C_YELLOW, data: a.revenuePeriods.map(p => toM(p.revenue)) }
      ] as any,
      { column: { borderRadius: 2, pointPadding: 0.06, borderWidth: 0 }, series: { animation: false } }, 0, false
    );
  });

  private baseChart(categories: string[], series: any[], plotOptions: any, decimals = 2, legend = true): ChartParameters {
    return {
      chart: this.chartSrv.getChartOptions({ margin: [10, 12, 40, 44] }),
      xAxis: { categories, lineColor: 'var(--chart-brd)', tickColor: 'var(--chart-brd)', labels: { style: { color: 'var(--secondary-txt)', fontSize: '10px' } } } as any,
      yAxis: [{ title: { text: null }, gridLineColor: C_GRID, labels: { style: { color: 'var(--secondary-txt)', fontSize: '10px' } }, tickAmount: 5 }] as any,
      legend: legend
        ? { enabled: true, align: 'right', verticalAlign: 'top', itemStyle: { color: 'var(--secondary-txt)', fontSize: '11px', fontWeight: '500' }, symbolWidth: 10 } as any
        : { enabled: false } as any,
      tooltip: { shared: true, backgroundColor: 'var(--chart-tlp)', borderWidth: 0, style: { color: 'var(--primary-txt)', fontSize: '11px' }, valueDecimals: decimals } as any,
      plotOptions,
      series
    };
  }

  // ───────── lifecycle ─────────
  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    await this.ppaLoader.ensureLoaded();
    await this.ppaLoader.ensureSlaHistory();
    this.loading.set(false);
    if (this.appInit.config.Timer) {
      this.timers = timer(this.appInit.config.Timer * 60000, this.appInit.config.Timer * 60000)
        .subscribe(() => this.ppaLoader.ensureSlaHistory(true));
    }
  }

  ngOnDestroy(): void {
    this.timers?.unsubscribe();
  }

  // ───────── helpers (template) ─────────
  fmtRate(v: number | null): string {
    return v == null ? '---' : v.toFixed(2);
  }

  /** "01/2027" → "Jan 2027" */
  fmtMonthKey(key: string): string {
    const [mm, yyyy] = key.split('/').map(x => parseInt(x, 10));
    if (isNaN(mm) || isNaN(yyyy)) { return key; }
    return `${MONTH_ABBR[mm - 1] ?? '?'} ${yyyy}`;
  }

  fmtPct(v: number | null, digits = 1): string {
    if (v == null) { return '---'; }
    return (v >= 0 ? '+' : '') + v.toFixed(digits) + '%';
  }

  fmtYears(v: number | null): string {
    return v == null ? '---' : v.toFixed(1);
  }

  formatShort(value: number | null): string {
    if (value == null) { return '---'; }
    const v = Math.abs(value); const sign = value < 0 ? '-' : '';
    if (v >= 1e9) { return sign + (v / 1e9).toFixed(2) + 'B'; }
    if (v >= 1e6) { const m = v / 1e6; return sign + (m >= 100 ? m.toFixed(0) : m.toFixed(1)) + 'M'; }
    if (v >= 1e3) { return sign + (v / 1e3).toFixed(0) + 'K'; }
    return sign + v.toFixed(0);
  }
}
