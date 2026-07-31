import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Subscription, timer } from 'rxjs';
import { SiteModel } from '../../../../shared/models/config.model';
import { PlantSlaModel } from '../../../../shared/models/masterdata.model';
import { AppInitService } from '../../../../shared/services/app-init.service';
import { BillingConfigModel } from '../../models/billing.model';
import { buildCompareYears, buildFinancialAnalytics } from '../../models/financial-analysis.model';
import { PpaDataLoader } from '../../services/ppa-data-loader';
import { selectPpaSiteList, selectPpaBillingConfigs, selectPpaSlaByYear, selectPpaMonthlyEnergy, selectPpaYearlyEnergy } from '../../store/selectors/ppa.selector';

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
  yearlyEnergy = toSignal(this.store.select(selectPpaYearlyEnergy), { initialValue: {} as Record<string, Record<number, number | null>> });
  loading = signal<boolean>(true);

  timers?: Subscription;
  date: Date = new Date();

  analytics = computed(() => buildFinancialAnalytics(
    this.siteList(), this.billingConfigs(), this.slaByYear(), this.date, DISCOUNT_RATE, this.monthlyEnergy()
  ));

  discountPct = DISCOUNT_RATE * 100;

  // ── ตารางเทียบรายปี (ตามชีท Compare ของลูกค้า) — เลือกทีละ site ─────────────
  selectedSiteId = signal<string | null>(null);

  activeSiteId = computed(() => {
    const sel = this.selectedSiteId();
    const sites = this.siteList();
    if (sel && sites.some(s => s.id === sel)) { return sel; }
    return sites.length > 0 ? sites[0].id : null;
  });

  compareRows = computed(() => {
    const id = this.activeSiteId();
    if (!id) { return []; }
    const cfg = this.billingConfigs().find(c => c.siteId === id);
    // โชว์เฉพาะปีที่มี actual แล้ว (ปีอนาคต/ปีที่ไม่มีข้อมูลตัดออก)
    return buildCompareYears(cfg, this.slaByYear()[id], this.yearlyEnergy()[id], this.monthlyEnergy()[id], this.date)
      .filter(r => r.actual != null);
  });

  // IRR สูงสุดในตาราง (สเกลแท่ง leaderboard)
  maxIrr = computed(() => Math.max(...this.analytics().siteRows.map(s => s.irr ?? 0), 1));

  irrBarPct(irr: number | null): number {
    if (irr == null) { return 0; }
    return Math.max(2, (irr / this.maxIrr()) * 100);
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

  /** จำนวนเต็มคั่นหลักพัน (kWh / ฿) */
  num(v: number | null): string {
    return v == null ? '---' : Math.round(v).toLocaleString('en-US');
  }

  /** จำนวนพร้อมเครื่องหมาย +/− */
  signed(v: number | null): string {
    if (v == null) { return '---'; }
    return (v > 0 ? '+' : '') + Math.round(v).toLocaleString('en-US');
  }

  signedPct(v: number | null): string {
    if (v == null) { return '---'; }
    return (v > 0 ? '+' : '') + v.toFixed(1) + '%';
  }

  rate(v: number | null): string { return v == null ? '---' : v.toFixed(2); }
  pct(v: number | null, d = 1): string { return v == null ? '---' : v.toFixed(d) + '%'; }
  years(v: number | null): string { return v == null ? '---' : v.toFixed(1); }

  codLabel(): string {
    const y = this.analytics().codYear;
    return y == null ? `${this.analytics().lifetimeYears}-year term` : `COD ${y}`;
  }
}
