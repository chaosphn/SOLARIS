import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Subscription, timer } from 'rxjs';
import { SiteModel } from '../../../../shared/models/config.model';
import { PlantSlaModel } from '../../../../shared/models/masterdata.model';
import { AppInitService } from '../../../../shared/services/app-init.service';
import { BillingConfigModel } from '../../models/billing.model';
import { buildFinancialAnalytics } from '../../models/financial-analysis.model';
import { PpaDataLoader } from '../../services/ppa-data-loader';
import { selectPpaSiteList, selectPpaBillingConfigs, selectPpaSlaByYear, selectPpaMonthlyEnergy } from '../../store/selectors/ppa.selector';

const DISCOUNT_RATE = 0.08;

@Component({
  selector: 'app-financial-analysis',
  standalone: false,
  templateUrl: './financial-analysis.html',
  styleUrl: './financial-analysis.scss',
})
export class FinancialAnalysis implements OnInit, OnDestroy {

  private store = inject(Store);
  private ppaLoader = inject(PpaDataLoader);
  private appInit = inject(AppInitService);

  siteList = toSignal(this.store.select(selectPpaSiteList), { initialValue: [] as SiteModel[] });
  billingConfigs = toSignal(this.store.select(selectPpaBillingConfigs), { initialValue: [] as BillingConfigModel[] });
  slaByYear = toSignal(this.store.select(selectPpaSlaByYear), { initialValue: {} as Record<string, Record<number, PlantSlaModel>> });
  monthlyEnergy = toSignal(this.store.select(selectPpaMonthlyEnergy), { initialValue: {} as Record<string, (number | null)[]> });
  loading = signal<boolean>(true);

  timers?: Subscription;
  date: Date = new Date();

  analytics = computed(() => buildFinancialAnalytics(
    this.siteList(), this.billingConfigs(), this.slaByYear(), this.date, DISCOUNT_RATE, this.monthlyEnergy()
  ));

  discountPct = DISCOUNT_RATE * 100;

  // verdict: viable ถ้า NPV > 0 และ IRR > hurdle (discount rate)
  verdict = computed<'viable' | 'marginal' | 'unviable' | null>(() => {
    const a = this.analytics();
    if (!a.hasCost || a.npv == null || a.projectIrr == null) { return null; }
    if (a.npv > 0 && a.projectIrr >= this.discountPct) { return 'viable'; }
    if (a.npv > 0) { return 'marginal'; }
    return 'unviable';
  });

  // money-flow = แท่งแนวนอน stacked (สัดส่วนของรายได้ตลอดสัญญา → Net / CAPEX / OPEX)
  moneySegments = computed(() => {
    const a = this.analytics();
    const total = a.lifetimeRevenue || 1;
    const segs = [
      { key: 'net', label: 'Net Profit', note: 'lifetime net profit', value: a.netProfit ?? 0, bg: '#E4B61A', fg: '#16171B' },
      { key: 'capex', label: 'CAPEX', note: 'initial investment', value: a.capex ?? 0, bg: '#2f3d4d', fg: '#85B7EB' },
      { key: 'opex', label: 'OPEX', note: 'total operating cost', value: a.lifetimeOpex ?? 0, bg: '#4a2d33', fg: '#F0997B' }
    ];
    return segs.map(s => ({ ...s, widthPct: Math.max(2, (s.value / total) * 100), pct: Math.round((s.value / total) * 100) }));
  });

  // IRR สูงสุดในตาราง (สเกลแท่ง leaderboard)
  maxIrr = computed(() => Math.max(...this.analytics().siteRows.map(s => s.irr ?? 0), 1));

  irrBarPct(irr: number | null): number {
    if (irr == null) { return 0; }
    return Math.max(2, (irr / this.maxIrr()) * 100);
  }

  // ข้อความสรุป sensitivity — ตามว่า NPV ยังบวกหรือพลิกลบที่ discount rate ไหน
  sensNote(): string {
    const bars = this.sensBars();
    if (bars.length === 0) { return ''; }
    const firstNeg = bars.find(b => !b.positive);
    if (!firstNeg) { return `NPV stays positive even at ${bars[bars.length - 1].rate}% discount rate`; }
    return `NPV turns negative at ${firstNeg.rate}% discount rate (IRR ≈ ${this.pct(this.analytics().projectIrr)})`;
  }

  // NPV sensitivity bars (scaled ต่อ npv สูงสุด)
  sensBars = computed(() => {
    const a = this.analytics();
    const max = Math.max(...a.sensitivity.map(s => Math.abs(s.npv)), 1);
    return a.sensitivity.map(s => ({
      rate: Math.round(s.rate * 100),
      npv: s.npv,
      heightPct: Math.max(3, (Math.abs(s.npv) / max) * 100),
      positive: s.npv >= 0,
      base: Math.abs(s.rate - this.analytics().discountRate) < 1e-6
    }));
  });

  // break-even marker (%) ตาม paybackYear / lifetime
  paybackPct = computed(() => {
    const a = this.analytics();
    if (a.paybackYear == null || a.lifetimeYears <= 0) { return null; }
    return Math.min(100, (a.paybackYear / a.lifetimeYears) * 100);
  });

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

  // ───────── format helpers ─────────
  /** ฿ ย่อ B/M/K พร้อมเครื่องหมาย */
  money(v: number | null): string {
    if (v == null) { return '---'; }
    const s = v < 0 ? '-' : '';
    const a = Math.abs(v);
    if (a >= 1e9) { return s + '฿' + (a / 1e9).toFixed(2) + 'B'; }
    if (a >= 1e6) { return s + '฿' + (a / 1e6).toFixed(a / 1e6 >= 100 ? 0 : 1) + 'M'; }
    if (a >= 1e3) { return s + '฿' + (a / 1e3).toFixed(0) + 'K'; }
    return s + '฿' + a.toFixed(0);
  }

  rate(v: number | null): string { return v == null ? '---' : v.toFixed(2); }
  pct(v: number | null, d = 1): string { return v == null ? '---' : v.toFixed(d) + '%'; }
  years(v: number | null): string { return v == null ? '---' : v.toFixed(1); }

  paybackRounded(): number | null {
    const p = this.analytics().payback;
    return p == null ? null : Math.round(p);
  }

  remainingProfitYears(): number | null {
    const p = this.paybackRounded();
    return p == null ? null : this.analytics().lifetimeYears - p;
  }

  codLabel(): string {
    const y = this.analytics().codYear;
    return y == null ? `${this.analytics().lifetimeYears}-year term` : `COD ${y}`;
  }
}
