import { SiteModel } from '../../../shared/models/config.model';
import { PlantSlaModel } from '../../../shared/models/masterdata.model';
import { BillingConfigModel } from './billing.model';
import { parseContactCost } from './contract.model';
import { rateForMonth } from './revenue-performance.model';

export const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface TariffYearCell {
  year: number;
  rate: number | null;
  isCurrent: boolean;
  color: string;            // heat color ตาม rate (จาง = ต่ำ, เข้ม = สูง)
}

export interface TariffMatrixRow {
  siteId: string;
  siteName: string;
  type: string;             // PPA | FLOATING | ''
  isSchedule: boolean;      // true = PPA (มี escalation), false = FLOATING
  cells: TariffYearCell[];
  firstRate: number | null;
  lastRate: number | null;
  growthPct: number | null; // (last/first − 1)×100
}

export interface EscalationEvent {
  siteId: string;
  date: Date;
  monthKey: string;         // เช่น "01/2027"
  from: number;
  to: number;
  pct: number;              // ((to−from)/from)×100
}

export interface RevenuePeriodPoint {
  label: string;            // เช่น "2024–28"
  startYear: number;
  endYear: number;
  revenue: number;          // ฿ (Σ warranty×rate ทุกปี×ทุก site ในช่วง)
}

export interface TariffAnalytics {
  hasData: boolean;
  years: number[];
  blendedByYear: (number | null)[];   // ยาวเท่ากับ years
  curYear: number;
  // KPI
  blendedNow: number | null;
  nextEscalation: EscalationEvent | null;
  avgAnnualEscalationPct: number | null;   // CAGR ของ blended
  minRate: number | null;
  maxRate: number | null;
  lifetimeGrowthPct: number | null;
  ppaCount: number;
  floatingCount: number;
  weightedRemainingYears: number | null;
  lifetimeRevenue: number;     // ฿ รวมทุกงวด (Σ revenuePeriods)
  // sections
  matrix: TariffMatrixRow[];
  upcoming: EscalationEvent[];
  revenuePeriods: RevenuePeriodPoint[];
}

/** อ่านค่า field รายปีจาก slaByYear พร้อม carry-forward (ปีที่ไม่มี record → ใช้ปีล่าสุดก่อนหน้า) */
export function slaValueForYear(
  byYear: Record<number, PlantSlaModel> | undefined,
  year: number,
  field: 'energy_delivery' | 'capex' | 'opex' | 'availability' | 'performance'
): number | null {
  if (!byYear) { return null; }
  const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);
  if (years.length === 0) { return null; }
  const exact = byYear[year]?.[field];
  if (exact != null) { return exact as number; }
  let pick: number | null = null;
  for (const y of years) { if (y <= year) { pick = y; } }
  if (pick == null) { pick = years[0]; }          // ก่อนช่วง → ใช้ปีแรกที่มี
  const v = byYear[pick]?.[field];
  return v != null ? (v as number) : null;
}

/** CAGR (%): อัตราเติบโตเฉลี่ยต่อปีแบบทบต้น จาก first → last ตลอด n ปี */
export function cagr(first: number, last: number, years: number): number | null {
  if (first <= 0 || last <= 0 || years <= 0) { return null; }
  return (Math.pow(last / first, 1 / years) - 1) * 100;
}

/** สีตาม rate: teal (ต่ำ) → red (สูง) แบ่ง 5 แถบตามตำแหน่ง normalized */
export function rateColor(rate: number | null, min: number, max: number): string {
  if (rate == null) { return 'transparent'; }
  if (max <= min) { return '#EF9F27'; }
  const t = (rate - min) / (max - min);
  if (t < 0.2) { return '#9fe1cb'; }
  if (t < 0.4) { return '#c0dd97'; }
  if (t < 0.6) { return '#EF9F27'; }
  if (t < 0.8) { return '#F0997B'; }
  return '#E05D4E';
}

/** เก็บ parsed contract + config ต่อ site (ครั้งเดียว ใช้ซ้ำ) */
interface SiteContract {
  site: SiteModel;
  cfg: BillingConfigModel | undefined;
  type: string;
  isSchedule: boolean;
  startYear: number | null;
  endYear: number | null;
  remainingYears: number | null;
  points: { start: Date; rate: number; key: string }[];   // จุด rate ตาม schedule (PPA)
}

export function buildTariffAnalytics(
  sites: SiteModel[],
  configs: BillingConfigModel[],
  slaByYear: Record<string, Record<number, PlantSlaModel>>,
  now: Date,
  periodYears = 5
): TariffAnalytics {
  const curYear = now.getFullYear();

  // ── parse contract ต่อ site ─────────────────────────────────────────────
  const contracts: SiteContract[] = sites.map(site => {
    const cfg = configs.find(c => c.siteId === site.id);
    const parsed = cfg ? parseContactCost(cfg.contactType, cfg.contactCost, now) : null;
    return {
      site,
      cfg,
      type: cfg?.contactType ?? '',
      isSchedule: parsed?.isSchedule ?? false,
      startYear: parsed?.startDate ? parsed.startDate.getFullYear() : null,
      endYear: parsed?.endDate ? parsed.endDate.getFullYear() : null,
      remainingYears: parsed?.remainingYears ?? null,
      points: (parsed?.rates ?? []).map(r => ({ start: r.start, rate: r.rate, key: r.key }))
    };
  });

  const ppa = contracts.filter(c => c.isSchedule);
  const floating = contracts.filter(c => c.cfg && !c.isSchedule);

  // ── ช่วงปีทั้ง portfolio (จากสัญญา PPA) ───────────────────────────────────
  let yStart = Infinity, yEnd = -Infinity;
  for (const c of ppa) {
    if (c.startYear != null) { yStart = Math.min(yStart, c.startYear); }
    if (c.endYear != null) { yEnd = Math.max(yEnd, c.endYear); }
  }
  if (!isFinite(yStart) || !isFinite(yEnd) || yEnd < yStart) {
    yStart = curYear; yEnd = curYear + 24;   // fallback ไม่มี PPA
  }
  const years: number[] = [];
  for (let y = yStart; y <= yEnd; y++) { years.push(y); }

  // ── rate ต่อ site ต่อปี (ใช้ rateForMonth กลางปี) ──────────────────────────
  const rateOf = (c: SiteContract, year: number): number | null =>
    c.cfg ? rateForMonth(c.cfg.contactType, c.cfg.contactCost, year, 6) : null;

  // min/max ทั่ว portfolio (จากจุด schedule จริง) สำหรับ heat color + KPI range
  let minRate = Infinity, maxRate = -Infinity;
  for (const c of contracts) {
    for (const p of c.points) { minRate = Math.min(minRate, p.rate); maxRate = Math.max(maxRate, p.rate); }
    // floating: ใช้ rate ปีปัจจุบัน
    if (!c.isSchedule && c.cfg) {
      const r = rateOf(c, curYear);
      if (r != null) { minRate = Math.min(minRate, r); maxRate = Math.max(maxRate, r); }
    }
  }
  if (!isFinite(minRate)) { minRate = 0; maxRate = 0; }

  // ── matrix ต่อ site ───────────────────────────────────────────────────────
  const matrix: TariffMatrixRow[] = contracts.map(c => {
    const cells: TariffYearCell[] = years.map(y => {
      const rate = c.cfg ? rateOf(c, y) : null;
      return { year: y, rate, isCurrent: y === curYear, color: rateColor(rate, minRate, maxRate) };
    });
    const firstRate = cells.find(x => x.rate != null)?.rate ?? null;
    const lastRate = [...cells].reverse().find(x => x.rate != null)?.rate ?? null;
    const growthPct = firstRate != null && lastRate != null && firstRate > 0
      ? (lastRate / firstRate - 1) * 100 : null;
    return {
      siteId: c.site.id, siteName: c.site.name, type: c.type, isSchedule: c.isSchedule,
      cells, firstRate, lastRate, growthPct
    };
  });

  // ── blended rate ต่อปี (ถ่วงด้วย warranty energy รายปี) ────────────────────
  const warrantyOf = (siteId: string, year: number) => slaValueForYear(slaByYear[siteId], year, 'energy_delivery');
  const blendedByYear: (number | null)[] = years.map(y => {
    let num = 0, den = 0;
    for (const c of contracts) {
      const rate = c.cfg ? rateOf(c, y) : null;
      const w = warrantyOf(c.site.id, y);
      if (rate != null && w != null && w > 0) { num += rate * w; den += w; }
    }
    return den > 0 ? num / den : null;
  });

  const idxCur = years.indexOf(curYear);
  const blendedNow = idxCur >= 0 ? blendedByYear[idxCur] : (blendedByYear.find(v => v != null) ?? null);

  const firstBlended = blendedByYear.find(v => v != null) ?? null;
  const lastBlended = [...blendedByYear].reverse().find(v => v != null) ?? null;
  const spanYears = yEnd - yStart;
  const avgAnnualEscalationPct = firstBlended != null && lastBlended != null
    ? cagr(firstBlended, lastBlended, spanYears) : null;
  const lifetimeGrowthPct = firstBlended != null && lastBlended != null && firstBlended > 0
    ? (lastBlended / firstBlended - 1) * 100 : null;

  // ── upcoming escalations (PPA, งวดที่ start > now) ─────────────────────────
  const upcoming: EscalationEvent[] = [];
  for (const c of ppa) {
    for (let i = 1; i < c.points.length; i++) {
      const p = c.points[i], prev = c.points[i - 1];
      if (p.start.getTime() > now.getTime() && p.rate !== prev.rate) {
        upcoming.push({
          siteId: c.site.id, date: p.start, monthKey: p.key,
          from: prev.rate, to: p.rate,
          pct: prev.rate > 0 ? ((p.rate - prev.rate) / prev.rate) * 100 : 0
        });
      }
    }
  }
  upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
  const nextEscalation = upcoming[0] ?? null;

  // ── revenue per period (block ละ periodYears ปี) ──────────────────────────
  const revenuePeriods: RevenuePeriodPoint[] = [];
  for (let ys = yStart; ys <= yEnd; ys += periodYears) {
    const ye = Math.min(ys + periodYears - 1, yEnd);
    let revenue = 0;
    for (let y = ys; y <= ye; y++) {
      for (const c of contracts) {
        const rate = c.cfg ? rateOf(c, y) : null;
        const w = warrantyOf(c.site.id, y);
        if (rate != null && w != null) { revenue += rate * w; }
      }
    }
    revenuePeriods.push({
      label: `${ys}–${ye.toString().slice(-2)}`,
      startYear: ys, endYear: ye, revenue
    });
  }

  // ── weighted remaining years (PPA, ถ่วง warranty ปีปัจจุบัน) ───────────────
  let wrNum = 0, wrDen = 0;
  for (const c of ppa) {
    const w = warrantyOf(c.site.id, curYear) ?? 0;
    if (c.remainingYears != null && w > 0) { wrNum += c.remainingYears * w; wrDen += w; }
  }
  const weightedRemainingYears = wrDen > 0 ? wrNum / wrDen : null;

  // ── รายได้รวมตลอดสัญญา = Σ ทุกงวด ─────────────────────────────────────────
  const lifetimeRevenue = revenuePeriods.reduce((sum, p) => sum + p.revenue, 0);

  const hasData = contracts.some(c => c.cfg != null) && years.length > 0;

  return {
    hasData, years, blendedByYear, curYear,
    blendedNow, nextEscalation, avgAnnualEscalationPct,
    minRate: isFinite(minRate) ? minRate : null,
    maxRate: isFinite(maxRate) ? maxRate : null,
    lifetimeGrowthPct,
    ppaCount: ppa.length, floatingCount: floating.length,
    weightedRemainingYears, lifetimeRevenue,
    matrix, upcoming, revenuePeriods
  };
}
