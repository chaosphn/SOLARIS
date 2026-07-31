import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Subscription, timer } from 'rxjs';
import { SiteModel } from '../../../../shared/models/config.model';
import { AppInitService } from '../../../../shared/services/app-init.service';
import { ChartService } from '../../../../shared/services/chart.service';
import { ChartParameters } from '../../../../shared/models/highchart.model';
import { PlantSlaModel } from '../../../../shared/models/masterdata.model';
import { BillingConfigModel } from '../../models/billing.model';
import { parseContactCost } from '../../models/contract.model';
import { MONTH_LABELS, RevMonthPoint, SiteRevRow, rateForMonth } from '../../models/revenue-performance.model';
import { PpaDataLoader } from '../../services/ppa-data-loader';
import { selectPpaSiteList, selectPpaBillingConfigs, selectPpaSlaData, selectPpaRealtimeData, selectPpaMonthlyEnergy } from '../../store/selectors/ppa.selector';

const C_ACTUAL = '#4DA3FF';
const C_FORECAST = '#5A3A34';
const C_TARGET = '#FBE134';
const C_GREEN = '#4CAF82';
const C_YELLOW = '#FBE134';
const C_RED = '#E05D4E';
const C_BLUE = '#4DA3FF';
const C_GRID = 'var(--chart-brd)';

@Component({
  selector: 'app-revenue-performance',
  standalone: false,
  templateUrl: './revenue-performance.html',
  styleUrl: './revenue-performance.scss',
})
export class RevenuePerformance implements OnInit, OnDestroy {

  private store = inject(Store);
  private ppaLoader = inject(PpaDataLoader);
  private appInit = inject(AppInitService);
  private chartSrv = inject(ChartService);

  // ข้อมูลกลางอ่านจาก ngrx store (โหลดครั้งเดียวผ่าน PpaDataLoader ใช้ร่วมกับหน้าอื่นในกลุ่ม PPA)
  siteList = toSignal(this.store.select(selectPpaSiteList), { initialValue: [] as SiteModel[] });
  billingConfigs = toSignal(this.store.select(selectPpaBillingConfigs), { initialValue: [] as BillingConfigModel[] });
  slaData = toSignal(this.store.select(selectPpaSlaData), { initialValue: {} as Record<string, PlantSlaModel> });
  realtimeData = toSignal(this.store.select(selectPpaRealtimeData), { initialValue: {} as Record<string, number> });
  monthlyEnergy = toSignal(this.store.select(selectPpaMonthlyEnergy), { initialValue: {} as Record<string, (number | null)[]> });
  loading = signal<boolean>(true);

  timers?: Subscription;
  date: Date = new Date();

  // ───────── core analytics (ทุก panel derive จาก object นี้) ─────────
  analytics = computed(() => {
    const sites = this.siteList();
    const configs = this.billingConfigs();
    const sla = this.slaData();
    const rt = this.realtimeData();
    const energy = this.monthlyEnergy();
    const year = this.date.getFullYear();
    const curMonth = this.date.getMonth();

    // revenue รายเดือนต่อ site (฿) + ประเภทสัญญา
    const siteRev: Record<string, (number | null)[]> = {};
    const siteMeta: Record<string, { type: string; isSchedule: boolean }> = {};
    for (const s of sites) {
      const cfg = configs.find(c => c.siteId === s.id);
      const arr: (number | null)[] = new Array(12).fill(null);
      if (cfg) {
        const parsed = parseContactCost(cfg.contactType, cfg.contactCost, this.date);
        siteMeta[s.id] = { type: cfg.contactType, isSchedule: parsed?.isSchedule ?? false };
        const e = energy[s.id];
        if (e) {
          for (let m = 0; m <= curMonth; m++) {
            const en = e[m];
            if (en != null) {
              const r = rateForMonth(cfg.contactType, cfg.contactCost, year, m);
              arr[m] = r != null ? en * r : null;
            }
          }
        }
      } else {
        siteMeta[s.id] = { type: '', isSchedule: false };
      }
      siteRev[s.id] = arr;
    }

    const contracted = sites.filter(s => siteMeta[s.id].type);

    // target รายเดือน (฿) = (warranty energy / 12) × rate เดือนนั้น รวมทุก site
    const monthlyTarget: number[] = new Array(12).fill(0);
    for (let m = 0; m < 12; m++) {
      let t = 0;
      for (const s of contracted) {
        const cfg = configs.find(c => c.siteId === s.id)!;
        const warranty = sla[s.id]?.financial_model_yield;
        const r = rateForMonth(cfg.contactType, cfg.contactCost, year, m);
        if (warranty != null && r != null) {
          t += (warranty / 12) * r;
        }
      }
      monthlyTarget[m] = t;
    }

    // actual รายเดือนรวม (฿) — null ถ้ายังไม่ถึงเดือน
    const monthlyActual: (number | null)[] = new Array(12).fill(null);
    for (let m = 0; m <= curMonth; m++) {
      let sum = 0;
      let any = false;
      for (const s of contracted) {
        const v = siteRev[s.id][m];
        if (v != null) { sum += v; any = true; }
      }
      monthlyActual[m] = any ? sum : null;
    }

    const ytdActual = monthlyActual.slice(0, curMonth + 1).reduce((acc: number, b) => acc + (b ?? 0), 0);
    const ytdTarget = monthlyTarget.slice(0, curMonth + 1).reduce((a, b) => a + b, 0);
    const achievement = ytdTarget > 0 ? (ytdActual / ytdTarget) * 100 : null;

    // forecast: ใช้ achievement ของเดือนที่ "จบแล้ว" (ไม่รวมเดือนปัจจุบันที่ยังไม่ครบ)
    // เดือนที่ไม่มีข้อมูล actual เลย (null) ไม่นับทั้ง actual และ target — กันไม่ให้ data หายไปฉุด ratio ต่ำผิดๆ
    let doneActual = 0;
    let doneTarget = 0;
    for (let m = 0; m < curMonth; m++) {
      const a = monthlyActual[m];
      if (a != null) {
        doneActual += a;
        doneTarget += monthlyTarget[m];
      }
    }
    const ratio = doneTarget > 0 ? doneActual / doneTarget : 1;

    // forecast เฉพาะเดือนอนาคต (m > เดือนปัจจุบัน) = target × สัดส่วน achievement ที่ผ่านมา
    const points: RevMonthPoint[] = [];
    let annualForecast = ytdActual;
    for (let m = 0; m < 12; m++) {
      const isFuture = m > curMonth;
      const forecast = isFuture ? monthlyTarget[m] * ratio : null;
      if (isFuture) { annualForecast += forecast ?? 0; }
      points.push({
        label: MONTH_LABELS[m],
        month: m,
        actual: monthlyActual[m],
        target: monthlyTarget[m],
        forecast,
        isFuture
      });
    }
    const annualPlan = monthlyTarget.reduce((a, b) => a + b, 0);

    // this month
    const thisMonthActual = monthlyActual[curMonth];
    const thisMonthTarget = monthlyTarget[curMonth];
    const thisMonthVar = thisMonthActual != null && thisMonthTarget > 0
      ? ((thisMonthActual - thisMonthTarget) / thisMonthTarget) * 100 : null;

    // ── variance decomposition (price vs volume) เดือนนี้ ──
    let actualEnergy = 0, targetEnergy = 0;
    for (const s of contracted) {
      const en = energy[s.id]?.[curMonth];
      if (en != null) { actualEnergy += en; }
      const warranty = sla[s.id]?.financial_model_yield;
      if (warranty != null) { targetEnergy += warranty / 12; }
    }
    const actRev = thisMonthActual ?? 0;
    const tgtRev = thisMonthTarget;
    const Rt = targetEnergy > 0 ? tgtRev / targetEnergy : 0;
    const Ra = actualEnergy > 0 ? actRev / actualEnergy : 0;
    const volumeEffect = (actualEnergy - targetEnergy) * Rt;
    const priceEffect = (Ra - Rt) * actualEnergy;

    // ── mix (PPA vs Floating) เดือนนี้ ──
    let ppaRev = 0, floatRev = 0, totalEnergy = 0;
    for (const s of contracted) {
      const v = siteRev[s.id][curMonth] ?? 0;
      if (siteMeta[s.id].isSchedule) { ppaRev += v; } else { floatRev += v; }
      totalEnergy += energy[s.id]?.[curMonth] ?? 0;
    }
    const mixTotal = ppaRev + floatRev;
    const blendedTariff = totalEnergy > 0 ? mixTotal / totalEnergy : null;

    // ── cumulative ──
    const cumActual: (number | null)[] = [];
    const cumPlan: number[] = [];
    let ca = 0, cp = 0;
    for (let m = 0; m < 12; m++) {
      cp += monthlyTarget[m];
      cumPlan.push(cp);
      if (m <= curMonth) { ca += monthlyActual[m] ?? 0; cumActual.push(ca); }
      else { cumActual.push(null); }
    }

    // ── trend ──
    const actualVals = monthlyActual.slice(0, curMonth + 1).filter((v): v is number => v != null);
    let best = { m: -1, v: -Infinity }, worst = { m: -1, v: Infinity };
    for (let m = 0; m <= curMonth; m++) {
      const v = monthlyActual[m];
      if (v == null) { continue; }
      if (v > best.v) { best = { m, v }; }
      if (v < worst.v) { worst = { m, v }; }
    }
    const avg = actualVals.length > 0 ? actualVals.reduce((a, b) => a + b, 0) / actualVals.length : null;
    const variance = avg != null && actualVals.length > 0
      ? actualVals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / actualVals.length : 0;
    const volatility = Math.sqrt(variance);
    const half = Math.floor(actualVals.length / 2);
    const firstHalf = actualVals.slice(0, half);
    const secondHalf = actualVals.slice(actualVals.length - half);
    const avgFirst = firstHalf.length ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
    const avgSecond = secondHalf.length ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;
    const momentum = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : null;

    // ── revenue at risk (จาก availability จริง vs 100%) ──
    let lostRev = 0;
    for (const s of contracted) {
      const rev = siteRev[s.id][curMonth];
      const av = rt[`${s.id}_AVAI`];
      if (rev != null && av != null && av > 0) {
        lostRev += rev * (100 - av) / av;
      }
    }
    const potentialRev = actRev + lostRev;
    const downtimePct = potentialRev > 0 ? (lostRev / potentialRev) * 100 : 0;

    // ── site matrix rows (ครบทุก site — ไม่มีสัญญา/ไม่มีค่า = null → "---") ──
    const rows: SiteRevRow[] = sites.map(s => {
      const meta = siteMeta[s.id];
      if (!meta.type) {
        return {
          siteId: s.id, siteName: s.name, type: '', isSchedule: false,
          thisMonth: null, ytd: null, target: null, variancePct: null, status: 'none' as const, spark: []
        };
      }
      const rev = siteRev[s.id];
      const thisMonth = rev[curMonth];
      const ytd = rev.slice(0, curMonth + 1).reduce((acc: number, b) => acc + (b ?? 0), 0);
      const cfg = configs.find(c => c.siteId === s.id)!;
      const warranty = sla[s.id]?.financial_model_yield;
      const r = rateForMonth(cfg.contactType, cfg.contactCost, year, curMonth);
      const target = warranty != null && r != null ? (warranty / 12) * r : null;
      const variancePct = thisMonth != null && target != null && target > 0 ? ((thisMonth - target) / target) * 100 : null;
      let status: SiteRevRow['status'] = 'none';
      if (variancePct != null) {
        status = variancePct >= 0 ? 'above' : variancePct >= -5 ? 'near' : 'below';
      }
      const start = Math.max(0, curMonth - 5);
      const spark = rev.slice(start, curMonth + 1).map(v => v ?? 0);
      return { siteId: s.id, siteName: s.name, type: meta.type, isSchedule: meta.isSchedule, thisMonth, ytd, target, variancePct, status, spark };
    }).sort((a, b) => (b.variancePct ?? -999) - (a.variancePct ?? -999));

    const aboveCount = rows.filter(r => r.status === 'above').length;
    const nearCount = rows.filter(r => r.status === 'near').length;
    const belowCount = rows.filter(r => r.status === 'below').length;

    return {
      hasData: contracted.length > 0 && Object.keys(energy).length > 0,
      points, curMonth,
      thisMonthActual, thisMonthTarget, thisMonthVar,
      ytdActual, ytdTarget, achievement, annualForecast, annualPlan,
      annualForecastVsPlan: annualPlan > 0 ? ((annualForecast - annualPlan) / annualPlan) * 100 : null,
      volumeEffect, priceEffect,
      ppaRev, floatRev, mixTotal, blendedTariff,
      cumActual, cumPlan,
      best, worst, avg, volatility, momentum,
      lostRev, downtimePct,
      rows, aboveCount, nearCount, belowCount,
      siteCount: sites.length
    };
  });

  // donut mix (SVG) — pie ใช้ app-highchart ไม่ได้ (ต้องมี xAxis/yAxis)
  mixDonut = computed(() => {
    const a = this.analytics();
    const C = 2 * Math.PI * 42;
    const ppaLen = a.mixTotal > 0 ? (a.ppaRev / a.mixTotal) * C : 0;
    return {
      ppaDash: `${ppaLen} ${C - ppaLen}`,
      floatDash: `${C - ppaLen} ${ppaLen}`,
      floatOffset: -ppaLen,
      ppaPct: a.mixTotal > 0 ? (a.ppaRev / a.mixTotal) * 100 : 0,
      floatPct: a.mixTotal > 0 ? (a.floatRev / a.mixTotal) * 100 : 0
    };
  });

  // ───────── Highcharts (3 กราฟหลัก) ─────────
  monthlyChart = computed<ChartParameters>(() => {
    const a = this.analytics();
    const toM = (v: number | null) => v == null ? null : Math.round(v / 1e6 * 100) / 100;
    return this.baseChart(
      MONTH_LABELS,
      [
        { type: 'column', name: 'Actual (฿M)', data: a.points.map(p => p.isFuture ? null : toM(p.actual)), color: C_ACTUAL },
        //{ type: 'column', name: 'Forecast (฿M)', data: a.points.map(p => p.isFuture ? toM(p.forecast) : null), color: C_FORECAST, borderColor: C_ACTUAL, borderWidth: 1 },
        { type: 'spline', name: 'Target (฿M)', data: a.points.map(p => toM(p.target)), color: C_TARGET, dashStyle: 'Dash', marker: { enabled: true, radius: 5 } }
      ] as any,
      { column: { grouping: false, borderRadius: 2, pointPadding: 0.06, groupPadding: 0.08, borderWidth: 0 }, series: { animation: false } }
    );
  });

  siteChart = computed<ChartParameters>(() => {
    const rt = this.realtimeData();
    const byId = new Map(this.analytics().rows.map(r => [r.siteId, r]));
    // ไล่สีตาม PR_MONTH: >75 เขียว, <30 แดง, ที่เหลือเหลือง, ไม่มีค่า = เทา
    const colorByPr = (pr: number | undefined) => pr == null ? '#5A6169' : pr > 75 ? C_GREEN : pr < 30 ? C_RED : C_YELLOW;
    // ครบทุก site (ไม่มีค่า = 0) แล้ว sort จากมากไปน้อย
    const items = this.siteList()
      .map(s => ({ id: s.id, value: byId.get(s.id)?.thisMonth ?? 0, pr: rt[`${s.id}_PR_MONTH`] }))
      .sort((a, b) => b.value - a.value);
    return this.baseChart(
      items.map(i => i.id),
      [{
        type: 'column', name: 'Revenue (฿M)', color: C_GREEN,
        data: items.map(i => ({ y: Math.round(i.value / 1e6 * 100) / 100, color: colorByPr(i.pr) }))
      }] as any,
      { column: { borderRadius: 2, pointPadding: 0.08, borderWidth: 0 }, series: { animation: false } },
      false
    );
  });

  cumulativeChart = computed<ChartParameters>(() => {
    const a = this.analytics();
    const toM = (v: number | null) => v == null ? null : Math.round(v / 1e6 * 100) / 100;
    return this.baseChart(
      MONTH_LABELS,
      [
        { type: 'spline', name: 'Actual (฿M)', data: a.cumActual.map(toM), color: C_GREEN, marker: { enabled: true, radius: 5 } },
        { type: 'spline', name: 'Plan (฿M)', data: a.cumPlan.map(v => toM(v)), color: C_TARGET, dashStyle: 'Dash', marker: { enabled: true, radius: 5 } }
      ] as any,
      { series: { animation: false } }
    );
  });

  private baseChart(categories: string[], series: any[], plotOptions: any, legend = true): ChartParameters {
    return {
      chart: this.chartSrv.getChartOptions({ margin: [10, 12, 40, 44] }),
      xAxis: {
        categories,
        lineColor: 'var(--chart-brd)',
        tickColor: 'var(--chart-brd)',
        labels: { style: { color: 'var(--secondary-txt)', fontSize: '11px' } }
      } as any,
      yAxis: [{
        title: { text: null },
        gridLineColor: C_GRID,
        labels: { style: { color: 'var(--secondary-txt)', fontSize: '11px' } },
        tickAmount: 5,
      }] as any,
      legend: legend
        ? { enabled: true, align: 'right', verticalAlign: 'top', itemStyle: { color: 'var(--secondary-txt)', fontSize: '11px', fontWeight: '500' }, symbolWidth: 10 } as any
        : { enabled: false } as any,
      tooltip: {
        shared: true,
        backgroundColor: 'var(--chart-tlp)',
        borderWidth: 0,
        style: { color: 'var(--primary-txt)', fontSize: '11px' },
        valueDecimals: 2
      } as any,
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
  formatShort(value: number | null): string {
    if (value == null) { return '---'; }
    const v = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (v >= 1e9) { return sign + (v / 1e9).toFixed(2) + 'B'; }
    if (v >= 1e6) { const m = v / 1e6; return sign + (m >= 100 ? m.toFixed(0) : m.toFixed(2)) + 'M'; }
    if (v >= 1e3) { return sign + (v / 1e3).toFixed(0) + 'K'; }
    return sign + v.toFixed(0);
  }

  sparkPoints(spark: number[]): string {
    if (spark.length === 0) { return ''; }
    const max = Math.max(...spark, 1);
    const min = Math.min(...spark, 0);
    const range = max - min || 1;
    const step = spark.length > 1 ? 60 / (spark.length - 1) : 0;
    return spark.map((v, i) => `${(i * step).toFixed(1)},${(14 - ((v - min) / range) * 12).toFixed(1)}`).join(' ');
  }

  statusColor(status: string): string {
    return status === 'above' ? C_GREEN : status === 'near' ? C_YELLOW : status === 'below' ? C_RED : 'var(--secondary-txt)';
  }

  monthLabel(m: number): string {
    return MONTH_LABELS[m] ?? '';
  }
}
