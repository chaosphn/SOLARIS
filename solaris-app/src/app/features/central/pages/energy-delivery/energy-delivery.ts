import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Subscription, timer } from 'rxjs';
import { SiteModel } from '../../../../shared/models/config.model';
import { PlantSlaModel } from '../../../../shared/models/masterdata.model';
import { AppInitService } from '../../../../shared/services/app-init.service';
import { ChartService } from '../../../../shared/services/chart.service';
import { ChartParameters } from '../../../../shared/models/highchart.model';
import { BillingConfigModel } from '../../models/billing.model';
import { rateForMonth } from '../../models/revenue-performance.model';
import {
  MONTH_LABELS, DeliveryMonthPoint, SiteComplianceRow, HeatmapRow,
  complianceStatus, heatColor
} from '../../models/energy-delivery.model';
import { PpaDataLoader } from '../../services/ppa-data-loader';
import { selectPpaSiteList, selectPpaBillingConfigs, selectPpaSlaData, selectPpaRealtimeData, selectPpaMonthlyEnergy } from '../../store/selectors/ppa.selector';

const C_GREEN = '#4CAF82';
const C_YELLOW = '#FBE134';
const C_RED = '#E05D4E';
const C_TARGET = '#FBE134';
const C_GRID = 'var(--chart-brd)';

@Component({
  selector: 'app-energy-delivery',
  standalone: false,
  templateUrl: './energy-delivery.html',
  styleUrl: './energy-delivery.scss',
})
export class EnergyDelivery implements OnInit, OnDestroy {

  private store = inject(Store);
  private ppaLoader = inject(PpaDataLoader);
  private appInit = inject(AppInitService);
  private chartSrv = inject(ChartService);

  siteList = toSignal(this.store.select(selectPpaSiteList), { initialValue: [] as SiteModel[] });
  billingConfigs = toSignal(this.store.select(selectPpaBillingConfigs), { initialValue: [] as BillingConfigModel[] });
  slaData = toSignal(this.store.select(selectPpaSlaData), { initialValue: {} as Record<string, PlantSlaModel> });
  realtimeData = toSignal(this.store.select(selectPpaRealtimeData), { initialValue: {} as Record<string, number> });
  monthlyEnergy = toSignal(this.store.select(selectPpaMonthlyEnergy), { initialValue: {} as Record<string, (number | null)[]> });
  loading = signal<boolean>(true);

  timers?: Subscription;
  date: Date = new Date();
  monthHeader = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  analytics = computed(() => {
    const sites = this.siteList();
    const configs = this.billingConfigs();
    const sla = this.slaData();
    const rt = this.realtimeData();
    const energy = this.monthlyEnergy();
    const year = this.date.getFullYear();
    const curMonth = this.date.getMonth();

    // site ที่มี warranty (SLA ppa_guaranteed_supply) = มีข้อผูกพันส่งมอบ
    const tracked = sites.filter(s => sla[s.id]?.financial_model_yield != null);

    // portfolio รายเดือน: actual (kWh) และ contracted (warranty/12)
    const monthlyActual: (number | null)[] = new Array(12).fill(null);
    const monthlyContracted: number[] = new Array(12).fill(0);
    for (let m = 0; m < 12; m++) {
      let contracted = 0;
      for (const s of tracked) { contracted += sla[s.id].financial_model_yield! / 12; }
      monthlyContracted[m] = contracted;
      if (m <= curMonth) {
        let act = 0, any = false;
        for (const s of tracked) { const v = energy[s.id]?.[m]; if (v != null) { act += v; any = true; } }
        monthlyActual[m] = any ? act : null;
      }
    }

    const ytdActual = monthlyActual.slice(0, curMonth + 1).reduce((a: number, b) => a + (b ?? 0), 0);
    const ytdContracted = monthlyContracted.slice(0, curMonth + 1).reduce((a, b) => a + b, 0);
    const achievement = ytdContracted > 0 ? (ytdActual / ytdContracted) * 100 : null;
    const surplus = ytdActual - ytdContracted;

    const points: DeliveryMonthPoint[] = [];
    const cumActual: (number | null)[] = [];
    const cumContracted: number[] = [];
    let ca = 0, cc = 0;
    for (let m = 0; m < 12; m++) {
      points.push({ label: MONTH_LABELS[m], month: m, actual: monthlyActual[m], contracted: monthlyContracted[m], isFuture: m > curMonth });
      cc += monthlyContracted[m]; cumContracted.push(cc);
      if (m <= curMonth) { ca += monthlyActual[m] ?? 0; cumActual.push(ca); } else { cumActual.push(null); }
    }

    // availability / PR portfolio (จาก realtime vs SLA warranty)
    const mean = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
    const avgAvai = mean(tracked.map(s => rt[`${s.id}_AVAI`]).filter((v): v is number => v != null));
    const avgWarrAvai = mean(tracked.map(s => sla[s.id]?.availability).filter((v): v is number => v != null));
    const avgPr = mean(tracked.map(s => rt[`${s.id}_PR_MONTH`]).filter((v): v is number => v != null));
    const avgWarrPr = mean(tracked.map(s => sla[s.id]?.performance).filter((v): v is number => v != null));

    // shortfall & penalty (YTD) = Σ เดือน Σ site max(0, contracted−actual) × tariff เดือนนั้น
    let ytdShortfall = 0, ytdPenalty = 0;
    for (const s of tracked) {
      const cfg = configs.find(c => c.siteId === s.id);
      const contractedM = sla[s.id].financial_model_yield! / 12;
      for (let m = 0; m <= curMonth; m++) {
        const act = energy[s.id]?.[m];
        if (act == null) { continue; }
        const short = Math.max(0, contractedM - act);
        ytdShortfall += short;
        const rate = cfg ? rateForMonth(cfg.contactType, cfg.contactCost, year, m) : null;
        if (rate != null) { ytdPenalty += short * rate; }
      }
    }
    const availPenalty = 0;   // ⚠️ ไม่มี penalty rate สำหรับ availability LD → placeholder

    // rows (ครบทุก site, เดือนนี้)
    const rows: SiteComplianceRow[] = sites.map(s => {
      const contractedAnnual = sla[s.id]?.financial_model_yield;
      const avai = rt[`${s.id}_AVAI`] ?? null;
      if (contractedAnnual == null) {
        return { siteId: s.id, siteName: s.name, actual: null, contracted: null, achievement: null, availability: avai, availWarranty: null, shortfall: 0, penalty: 0, status: 'none' as const, spark: [] };
      }
      const contractedM = contractedAnnual / 12;
      const actual = energy[s.id]?.[curMonth] ?? null;
      const achievement = actual != null && contractedM > 0 ? (actual / contractedM) * 100 : null;
      const availWarr = sla[s.id]?.availability ?? null;
      const shortfall = actual != null ? Math.max(0, contractedM - actual) : 0;
      const cfg = configs.find(c => c.siteId === s.id);
      const rate = cfg ? rateForMonth(cfg.contactType, cfg.contactCost, year, curMonth) : null;
      const penalty = rate != null ? shortfall * rate : 0;
      const status = complianceStatus(achievement, avai, availWarr);
      const start = Math.max(0, curMonth - 5);
      const spark: number[] = [];
      for (let m = start; m <= curMonth; m++) {
        const a = energy[s.id]?.[m];
        spark.push(a != null && contractedM > 0 ? (a / contractedM) * 100 : 0);
      }
      return { siteId: s.id, siteName: s.name, actual, contracted: contractedM, achievement, availability: avai, availWarranty: availWarr, shortfall, penalty, status, spark };
    }).sort((a, b) => (a.achievement ?? 999) - (b.achievement ?? 999));   // worst first

    const metCount = rows.filter(r => r.status === 'met').length;
    const warnCount = rows.filter(r => r.status === 'warn-energy' || r.status === 'warn-avail').length;
    const breachCount = rows.filter(r => r.status === 'breach').length;
    const belowAvail = tracked.filter(s => {
      const a = rt[`${s.id}_AVAI`]; const w = sla[s.id]?.availability;
      return a != null && w != null && a < w;
    }).length;

    // heatmap: ครบทุก site เรียงตาม id — ช่องที่ไม่มีค่า = null (n/a เทา)
    const heatmap: HeatmapRow[] = [...sites].map(s => {
      const contractedAnnual = sla[s.id]?.financial_model_yield;
      const contractedM = contractedAnnual != null ? contractedAnnual / 12 : null;
      const cells: (number | null)[] = [];
      for (let m = 0; m < 12; m++) {
        if (m > curMonth) { cells.push(null); continue; }
        const a = energy[s.id]?.[m];
        cells.push(a != null && contractedM != null && contractedM > 0 ? (a / contractedM) * 100 : null);
      }
      return { siteId: s.id, cells };
    });

    return {
      hasData: tracked.length > 0 && Object.keys(energy).length > 0,
      curMonth, points, cumActual, cumContracted,
      ytdActual, ytdContracted, achievement, surplus,
      thisMonthActual: monthlyActual[curMonth], thisMonthContracted: monthlyContracted[curMonth],
      avgAvai, avgWarrAvai, avgPr, avgWarrPr,
      ytdShortfall, ytdPenalty, availPenalty, totalPenalty: ytdPenalty + availPenalty,
      bonus: surplus > 0 ? surplus : 0,   // over-delivery (kWh) — มูลค่าคำนวณตอนแสดง
      trackedCount: sites.length, siteCount: sites.length,
      metCount, warnCount, breachCount, belowAvail,
      compliantMonths: monthlyActual.slice(0, curMonth + 1).filter((v, i) => v != null && v >= monthlyContracted[i]).length,
      monthsElapsed: curMonth + 1,
      rows, heatmap
    };
  });

  // ───────── Highcharts ─────────
  deliveryChart = computed<ChartParameters>(() => {
    const a = this.analytics();
    const toG = (v: number | null) => v == null ? null : Math.round(v / 1e3 * 100) / 100;
    return this.baseChart(
      MONTH_LABELS,
      [
        {
          type: 'column', name: 'Actual (MWh)', color: C_GREEN,
          data: a.points.map(p => p.isFuture ? null : ({ y: toG(p.actual), color: (p.actual ?? 0) >= p.contracted ? C_GREEN : C_RED }))
        },
        { type: 'spline', name: 'Contracted (MWh)', data: a.points.map(p => toG(p.contracted)), color: C_TARGET, dashStyle: 'Dash', marker: { enabled: true, radius: 5 } }
      ] as any,
      { column: { borderRadius: 2, pointPadding: 0.08, borderWidth: 0 }, series: { animation: false } }
    );
  });

  cumulativeChart = computed<ChartParameters>(() => {
    const a = this.analytics();
    const toG = (v: number | null) => v == null ? null : Math.round(v / 1e3 * 100) / 100;
    return this.baseChart(
      MONTH_LABELS,
      [
        { type: 'spline', name: 'Actual (MWh)', data: a.cumActual.map(toG), color: C_GREEN, marker: { enabled: true, radius: 5 } },
        { type: 'spline', name: 'Contracted (MWh)', data: a.cumContracted.map(v => toG(v)), color: C_TARGET, dashStyle: 'Dash', marker: { enabled: true, radius: 5 } }
      ] as any,
      { series: { animation: false } }
    );
  });

  private baseChart(categories: string[], series: any[], plotOptions: any, legend = true): ChartParameters {
    return {
      chart: this.chartSrv.getChartOptions({ margin: [10, 12, 40, 44] }),
      xAxis: { categories, lineColor: 'var(--chart-brd)', tickColor: 'var(--chart-brd)', labels: { style: { color: 'var(--secondary-txt)', fontSize: '10px' } } } as any,
      yAxis: [{ title: { text: null }, gridLineColor: C_GRID, labels: { style: { color: 'var(--secondary-txt)', fontSize: '10px' } }, tickAmount: 5 }] as any,
      legend: legend
        ? { enabled: true, align: 'right', verticalAlign: 'top', itemStyle: { color: 'var(--secondary-txt)', fontSize: '11px', fontWeight: '500' }, symbolWidth: 10 } as any
        : { enabled: false } as any,
      tooltip: { shared: true, backgroundColor: 'var(--chart-tlp)', borderWidth: 0, style: { color: 'var(--primary-txt)', fontSize: '11px' }, valueDecimals: 2 } as any,
      plotOptions,
      series
    };
  }

  // ───────── lifecycle ─────────
  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    await this.ppaLoader.ensureLoaded();
    this.loading.set(false);
    if (this.appInit.config.Timer) {
      this.timers = timer(this.appInit.config.Timer * 60000, this.appInit.config.Timer * 60000)
        .subscribe(() => this.ppaLoader.ensureLoaded(true));
    }
  }

  ngOnDestroy(): void {
    this.timers?.unsubscribe();
  }

  // ───────── helpers (template) ─────────
  toGWh(kwh: number | null): string {
    if (kwh == null) { return '---'; }
    return (kwh / 1e6).toFixed(2);
  }

  toMWh(kwh: number | null): string {
    if (kwh == null) { return '---'; }
    return (kwh / 1e3).toFixed(1);
  }

  formatShort(value: number | null): string {
    if (value == null) { return '---'; }
    const v = Math.abs(value); const sign = value < 0 ? '-' : '';
    if (v >= 1e9) { return sign + (v / 1e9).toFixed(2) + 'B'; }
    if (v >= 1e6) { const m = v / 1e6; return sign + (m >= 100 ? m.toFixed(0) : m.toFixed(1)) + 'M'; }
    if (v >= 1e3) { return sign + (v / 1e3).toFixed(0) + 'K'; }
    return sign + v.toFixed(0);
  }

  heatColor(pct: number | null): string {
    return heatColor(pct);
  }

  statusColor(status: string): string {
    return status === 'met' ? C_GREEN
      : status === 'warn-energy' || status === 'warn-avail' ? C_YELLOW
      : status === 'breach' ? C_RED : 'var(--secondary-txt)';
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'met': return '✓ met';
      case 'warn-energy': return '⚠ energy';
      case 'warn-avail': return '⚠ avail';
      case 'breach': return '✗ breach';
      default: return '—';
    }
  }

  sparkPoints(spark: number[]): string {
    if (spark.length === 0) { return ''; }
    const max = Math.max(...spark, 100);
    const min = Math.min(...spark, 0);
    const range = max - min || 1;
    const step = spark.length > 1 ? 60 / (spark.length - 1) : 0;
    return spark.map((v, i) => `${(i * step).toFixed(1)},${(14 - ((v - min) / range) * 12).toFixed(1)}`).join(' ');
  }

  monthLabel(m: number): string {
    return MONTH_LABELS[m] ?? '';
  }
}
