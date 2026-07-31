import { SiteModel } from '../../../shared/models/config.model';
import { PlantSlaModel } from '../../../shared/models/masterdata.model';
import { BillingConfigModel } from './billing.model';
import { rateForMonth } from './revenue-performance.model';

export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** เกณฑ์ผ่าน energy delivery (% ตามสัญญา PPA/O&M) */
export const ENERGY_TARGET_PCT = 95;

export interface SlaSiteRow {
  siteId: string;
  siteName: string;
  availability: number | null;
  warrAvai: number | null;
  pr: number | null;
  warrPr: number | null;
  energyAchv: number | null;      // % YTD (actual/contracted)
  penalty: number;                // ฿
  bonus: number;                  // ฿
  health: number | null;          // /100
  status: 'met' | 'warning' | 'breach' | 'none';
}

export interface ChecklistItem {
  label: string;
  pass: boolean;
}

export interface SlaAnalytics {
  hasData: boolean;
  // portfolio SLA
  avgAvai: number | null;
  avgWarrAvai: number | null;
  avgPr: number | null;
  avgWarrPr: number | null;
  energyDeliveryPct: number | null;   // portfolio YTD achievement %
  energyTarget: number;               // 95
  compliantSites: number;
  trackedSites: number;
  breachSites: number;
  warningSites: number;
  healthScore: number | null;
  penaltyTotal: number;
  bonusTotal: number;
  netSla: number;
  // health breakdown (portfolio, 0-100)
  healthAvai: number | null;
  healthPr: number | null;
  healthEnergy: number | null;
  // sections
  trend: (number | null)[];           // 12 เดือน energy compliance %
  curMonth: number;
  rows: SlaSiteRow[];
  checklist: ChecklistItem[];
  passedChecks: number;
}

const clamp100 = (v: number) => Math.max(0, Math.min(100, v));

/** health ต่อ site = ถ่วง 0.3 avai + 0.3 pr + 0.4 energy (แต่ละ comp = min(100, actual/target×100)) */
function siteHealth(avai: number | null, warrAvai: number | null, pr: number | null, warrPr: number | null, energyAchv: number | null): number | null {
  const comps: { w: number; s: number }[] = [];
  if (avai != null && warrAvai != null && warrAvai > 0) { comps.push({ w: 0.3, s: clamp100(avai / warrAvai * 100) }); }
  if (pr != null && warrPr != null && warrPr > 0) { comps.push({ w: 0.3, s: clamp100(pr / warrPr * 100) }); }
  if (energyAchv != null) { comps.push({ w: 0.4, s: clamp100(energyAchv) }); }
  if (comps.length === 0) { return null; }
  const wsum = comps.reduce((a, c) => a + c.w, 0);
  return comps.reduce((a, c) => a + c.w * c.s, 0) / wsum;
}

export function buildSlaAnalytics(
  sites: SiteModel[],
  slaData: Record<string, PlantSlaModel>,
  realtimeData: Record<string, number>,
  monthlyEnergy: Record<string, (number | null)[]>,
  configs: BillingConfigModel[],
  now: Date
): SlaAnalytics {
  const year = now.getFullYear();
  const curMonth = now.getMonth();

  // site ที่มี warranty energy = มีข้อผูกพัน SLA
  const tracked = sites.filter(s => slaData[s.id]?.financial_model_yield != null);

  const rows: SlaSiteRow[] = sites.map(s => {
    const sla = slaData[s.id];
    const warrEnergy = sla?.financial_model_yield ?? null;
    const warrAvai = sla?.availability ?? null;
    const warrPr = sla?.performance ?? null;
    const avai = realtimeData[`${s.id}_AVAI`] ?? null;
    const pr = realtimeData[`${s.id}_PR_MONTH`] ?? null;
    const cfg = configs.find(c => c.siteId === s.id);

    if (warrEnergy == null) {
      return { siteId: s.id, siteName: s.name, availability: avai, warrAvai, pr, warrPr, energyAchv: null, penalty: 0, bonus: 0, health: null, status: 'none' as const };
    }

    const contractedM = warrEnergy / 12;
    // YTD achievement + penalty/bonus รายเดือน
    let actYtd = 0, contractedYtd = 0, penalty = 0, bonus = 0;
    for (let m = 0; m <= curMonth; m++) {
      contractedYtd += contractedM;
      const act = monthlyEnergy[s.id]?.[m];
      if (act == null) { continue; }
      actYtd += act;
      const rate = cfg ? rateForMonth(cfg.contactType, cfg.contactCost, year, m) : null;
      if (rate != null) {
        if (act < contractedM) { penalty += (contractedM - act) * rate; }
        else { bonus += (act - contractedM) * rate; }
      }
    }
    const energyAchv = contractedYtd > 0 ? (actYtd / contractedYtd) * 100 : null;
    const health = siteHealth(avai, warrAvai, pr, warrPr, energyAchv);

    // status
    const availFail = avai != null && warrAvai != null && avai < warrAvai;
    const prFail = pr != null && warrPr != null && pr < warrPr;
    const energyFail = energyAchv != null && energyAchv < ENERGY_TARGET_PCT;
    let status: SlaSiteRow['status'];
    if (availFail || (energyAchv != null && energyAchv < 90)) { status = 'breach'; }
    else if (energyFail || prFail) { status = 'warning'; }
    else { status = 'met'; }

    return { siteId: s.id, siteName: s.name, availability: avai, warrAvai, pr, warrPr, energyAchv, penalty, bonus, health, status };
  });

  // portfolio averages
  const mean = (arr: (number | null | undefined)[]): number | null => {
    const v = arr.filter((x): x is number => x != null);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };
  const avgAvai = mean(tracked.map(s => realtimeData[`${s.id}_AVAI`]));
  const avgWarrAvai = mean(tracked.map(s => slaData[s.id]?.availability));
  const avgPr = mean(tracked.map(s => realtimeData[`${s.id}_PR_MONTH`]));
  const avgWarrPr = mean(tracked.map(s => slaData[s.id]?.performance));

  // portfolio energy delivery (YTD) + trend รายเดือน
  const trend: (number | null)[] = new Array(12).fill(null);
  let actYtdAll = 0, contractedYtdAll = 0;
  for (let m = 0; m < 12; m++) {
    let act = 0, contracted = 0, any = false;
    for (const s of tracked) {
      const contractedM = slaData[s.id].financial_model_yield! / 12;
      contracted += contractedM;
      const v = monthlyEnergy[s.id]?.[m];
      if (m <= curMonth && v != null) { act += v; any = true; }
    }
    if (m <= curMonth && contracted > 0 && any) { trend[m] = (act / contracted) * 100; }
    if (m <= curMonth) { actYtdAll += act; contractedYtdAll += contracted; }
  }
  const energyDeliveryPct = contractedYtdAll > 0 ? (actYtdAll / contractedYtdAll) * 100 : null;

  const penaltyTotal = rows.reduce((a, r) => a + r.penalty, 0);
  const bonusTotal = rows.reduce((a, r) => a + r.bonus, 0);

  // health breakdown (portfolio = เฉลี่ย component ของ tracked)
  const healthAvai = mean(rows.filter(r => r.status !== 'none').map(r => r.availability != null && r.warrAvai ? clamp100(r.availability / r.warrAvai * 100) : null));
  const healthPr = mean(rows.filter(r => r.status !== 'none').map(r => r.pr != null && r.warrPr ? clamp100(r.pr / r.warrPr * 100) : null));
  const healthEnergy = mean(rows.filter(r => r.status !== 'none').map(r => r.energyAchv != null ? clamp100(r.energyAchv) : null));
  const healthScore = mean(rows.map(r => r.health));

  // status counts (เรียง worst first)
  rows.sort((a, b) => {
    const order = { breach: 0, warning: 1, met: 2, none: 3 };
    return order[a.status] - order[b.status] || (a.energyAchv ?? 999) - (b.energyAchv ?? 999);
  });
  const compliantSites = rows.filter(r => r.status === 'met').length;
  const breachSites = rows.filter(r => r.status === 'breach').length;
  const warningSites = rows.filter(r => r.status === 'warning').length;

  // no shortfall month (portfolio)
  const noShortfallMonth = trend.slice(0, curMonth + 1).every(v => v == null || v >= 100);

  // ── checklist 12 auto-check ────────────────────────────────────────────────
  const checklist: ChecklistItem[] = [
    { label: 'Portfolio availability ≥ warranty', pass: avgAvai != null && avgWarrAvai != null && avgAvai >= avgWarrAvai },
    { label: 'Portfolio PR ≥ warranty', pass: avgPr != null && avgWarrPr != null && avgPr >= avgWarrPr },
    { label: `Energy delivery ≥ ${ENERGY_TARGET_PCT}%`, pass: energyDeliveryPct != null && energyDeliveryPct >= ENERGY_TARGET_PCT },
    { label: 'YTD energy ≥ contracted', pass: energyDeliveryPct != null && energyDeliveryPct >= 100 },
    { label: 'No site in breach', pass: breachSites === 0 },
    { label: 'No shortfall month (YTD)', pass: noShortfallMonth },
    { label: 'All sites reporting data', pass: tracked.length > 0 && tracked.every(s => realtimeData[`${s.id}_AVAI`] != null) },
    { label: 'All sites have SLA warranty', pass: sites.length > 0 && tracked.length === sites.length },
    { label: 'Penalty = ฿0 (YTD)', pass: penaltyTotal === 0 },
    { label: 'Over-delivery bonus positive', pass: bonusTotal > 0 },
    { label: 'Every site availability ≥ warranty', pass: rows.filter(r => r.status !== 'none').every(r => r.availability == null || r.warrAvai == null || r.availability >= r.warrAvai) },
    { label: 'Every site PR ≥ warranty', pass: rows.filter(r => r.status !== 'none').every(r => r.pr == null || r.warrPr == null || r.pr >= r.warrPr) },
  ];
  const passedChecks = checklist.filter(c => c.pass).length;

  return {
    hasData: tracked.length > 0,
    avgAvai, avgWarrAvai, avgPr, avgWarrPr,
    energyDeliveryPct, energyTarget: ENERGY_TARGET_PCT,
    compliantSites, trackedSites: sites.length, breachSites, warningSites,
    healthScore, penaltyTotal, bonusTotal, netSla: bonusTotal - penaltyTotal,
    healthAvai, healthPr, healthEnergy,
    trend, curMonth, rows, checklist, passedChecks
  };
}
