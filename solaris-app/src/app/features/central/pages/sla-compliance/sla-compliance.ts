import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Subscription, timer } from 'rxjs';
import { SiteModel } from '../../../../shared/models/config.model';
import { PlantSlaModel } from '../../../../shared/models/masterdata.model';
import { AppInitService } from '../../../../shared/services/app-init.service';
import { BillingConfigModel } from '../../models/billing.model';
import { buildSlaAnalytics, MONTH_LABELS } from '../../models/sla-compliance.model';
import { PpaDataLoader } from '../../services/ppa-data-loader';
import {
  selectPpaSiteList, selectPpaBillingConfigs, selectPpaSlaData, selectPpaRealtimeData, selectPpaMonthlyEnergy
} from '../../store/selectors/ppa.selector';

// พิกัด SVG trend
const TX0 = 40, TX1 = 852, TY0 = 14, TY1 = 160, TVMIN = 88, TVMAX = 112;

@Component({
  selector: 'app-sla-compliance',
  standalone: false,
  templateUrl: './sla-compliance.html',
  styleUrl: './sla-compliance.scss',
})
export class SlaCompliance implements OnInit, OnDestroy {

  private store = inject(Store);
  private ppaLoader = inject(PpaDataLoader);
  private appInit = inject(AppInitService);

  siteList = toSignal(this.store.select(selectPpaSiteList), { initialValue: [] as SiteModel[] });
  billingConfigs = toSignal(this.store.select(selectPpaBillingConfigs), { initialValue: [] as BillingConfigModel[] });
  slaData = toSignal(this.store.select(selectPpaSlaData), { initialValue: {} as Record<string, PlantSlaModel> });
  realtimeData = toSignal(this.store.select(selectPpaRealtimeData), { initialValue: {} as Record<string, number> });
  monthlyEnergy = toSignal(this.store.select(selectPpaMonthlyEnergy), { initialValue: {} as Record<string, (number | null)[]> });
  loading = signal<boolean>(true);

  timers?: Subscription;
  date: Date = new Date();
  monthHeader = MONTH_LABELS;

  analytics = computed(() => buildSlaAnalytics(
    this.siteList(), this.slaData(), this.realtimeData(), this.monthlyEnergy(), this.billingConfigs(), this.date
  ));

  // trend points (SVG)
  trendPoints = computed(() => {
    const t = this.analytics().trend;
    return t.map((v, i) => {
      const x = TX0 + (TX1 - TX0) * (i / 11);
      const y = v == null ? null : TY1 - ((Math.min(TVMAX, Math.max(TVMIN, v)) - TVMIN) / (TVMAX - TVMIN)) * (TY1 - TY0);
      return { x: Math.round(x), y: y == null ? null : Math.round(y), v, month: MONTH_LABELS[i] };
    });
  });
  trendLine = computed(() => this.trendPoints().filter(p => p.y != null).map(p => `${p.x},${p.y}`).join(' '));

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

  // ───────── helpers ─────────
  pct(v: number | null, d = 1): string { return v == null ? '---' : v.toFixed(d) + '%'; }
  num(v: number | null, d = 0): string { return v == null ? '--' : v.toFixed(d); }

  money(v: number | null): string {
    if (v == null) { return '---'; }
    const s = v < 0 ? '-' : '';
    const a = Math.abs(v);
    if (a >= 1e6) { return s + '฿' + (a / 1e6).toFixed(1) + 'M'; }
    if (a >= 1e3) { return s + '฿' + (a / 1e3).toFixed(0) + 'K'; }
    return s + '฿' + a.toFixed(0);
  }

  statusColor(status: string): string {
    return status === 'met' ? '#4CAF82'
      : status === 'warning' ? '#E4B61A'
      : status === 'breach' ? '#E05D4E' : 'var(--secondary-txt)';
  }

  gaugePct(v: number | null): number {
    return v == null ? 0 : Math.max(0, Math.min(100, v));
  }
}
