import { SiteModel } from '../../../shared/models/config.model';
import { PlantSlaModel } from '../../../shared/models/masterdata.model';
import { BillingConfigModel } from './billing.model';
import { parseContactCost } from './contract.model';
import { rateForMonth } from './revenue-performance.model';
import { slaValueForYear } from './tariff-escalation.model';

export interface WaterfallStep {
  label: string;
  value: number;                 // ฿ (เซ็นตามทิศ: revenue +, opex/capex −, net +)
  kind: 'positive' | 'negative' | 'total';
}

export interface SensitivityPoint {
  rate: number;                  // 0.06 ...
  npv: number;                   // ฿
}

export interface SiteFinancialRow {
  rank: number;
  siteId: string;
  siteName: string;
  capex: number | null;
  opexAnnual: number | null;
  revenueAnnual: number | null;
  ebitda: number | null;
  irr: number | null;            // %
  payback: number | null;        // ปี
  lcoe: number | null;           // ฿/kWh
}

export interface FinancialAnalytics {
  hasData: boolean;
  hasCost: boolean;              // มี capex/opex จริงไหม (ไม่มี → cost/return = null)
  discountRate: number;          // 0.08
  lifetimeYears: number;

  // top strip (portfolio header)
  contractValue: number | null;      // PV ของรายได้ตลอดสัญญา
  avgTariff: number | null;          // ฿/kWh (= blended now)
  revenueYtd: number | null;         // ฿ (actual จาก monthlyEnergy)
  revenueYtdVsTargetPct: number | null;
  deliveryPct: number | null;        // % (actual/contracted YTD)
  contractLeftYears: number | null;
  codYear: number | null;

  // portfolio KPI
  capex: number | null;
  annualOpex: number | null;
  npv: number | null;
  projectIrr: number | null;     // %
  equityIrr: number | null;      // N/A (รอ loan terms)
  payback: number | null;        // ปี
  discountedPayback: number | null;
  lcoe: number | null;           // ฿/kWh

  revenueAnnual: number | null;
  ebitdaAnnual: number | null;
  ebitdaMargin: number | null;   // %
  opexPerKwh: number | null;
  opexPerMwp: number | null;

  lifetimeRevenue: number;
  lifetimeOpex: number | null;
  netProfit: number | null;

  blendedTariffNow: number | null;   // ฿/kWh
  lcoeHeadroom: number | null;       // tariff − lcoe
  lcoeRatio: number | null;          // tariff / lcoe

  // sections
  waterfall: WaterfallStep[];
  sensitivity: SensitivityPoint[];
  years: number[];
  cashflowCumulative: number[];      // ฿ สะสม (index 0 = −capex)
  paybackYear: number | null;
  siteRows: SiteFinancialRow[];
}

const DISCOUNT_RATES = [0.06, 0.08, 0.10, 0.12];

/** NPV ของกระแสเงินสด (t = 0..n) ที่ discount rate r */
export function npvOf(cashflows: number[], r: number): number {
  let sum = 0;
  for (let t = 0; t < cashflows.length; t++) { sum += cashflows[t] / Math.pow(1 + r, t); }
  return sum;
}

/** IRR: หา r ที่ NPV = 0 ด้วย bisection (คืน null ถ้าไม่มี sign change) */
export function irrOf(cashflows: number[]): number | null {
  let lo = -0.9, hi = 1.0;
  let fLo = npvOf(cashflows, lo);
  let fHi = npvOf(cashflows, hi);
  if (isNaN(fLo) || isNaN(fHi) || fLo * fHi > 0) { return null; }
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npvOf(cashflows, mid);
    if (fLo * fMid <= 0) { hi = mid; fHi = fMid; } else { lo = mid; fLo = fMid; }
  }
  return (lo + hi) / 2;
}

/** Payback (ปี): ปีที่กระแสสะสมตัด 0 พร้อม interpolate เศษปี · nets = net รายปี (ปี 1..L) */
function paybackOf(capex: number, nets: number[], discountRate?: number): number | null {
  let cum = -capex;
  for (let t = 0; t < nets.length; t++) {
    const flow = discountRate != null ? nets[t] / Math.pow(1 + discountRate, t + 1) : nets[t];
    const prev = cum;
    cum += flow;
    if (cum >= 0) { return t + (flow > 0 ? (-prev) / flow : 0); }
  }
  return null;
}

interface SiteCashflow {
  site: SiteModel;
  cfg: BillingConfigModel | undefined;
  startYear: number | null;
  endYear: number | null;
  capex: number | null;
  revenueByYear: number[];       // ปี 1..L
  opexByYear: (number | null)[];
  energyByYear: number[];        // kWh
}

export function buildFinancialAnalytics(
  sites: SiteModel[],
  configs: BillingConfigModel[],
  slaByYear: Record<string, Record<number, PlantSlaModel>>,
  now: Date,
  discountRate = 0.00,
  monthlyEnergy: Record<string, (number | null)[]> = {}
): FinancialAnalytics {
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();

  // ── ช่วงปี portfolio (จากสัญญา PPA) ───────────────────────────────────────
  let yStart = Infinity, yEnd = -Infinity;
  const contracts = sites.map(site => {
    const cfg = configs.find(c => c.siteId === site.id);
    const parsed = cfg ? parseContactCost(cfg.contactType, cfg.contactCost, now) : null;
    const sy = parsed?.startDate ? parsed.startDate.getFullYear() : null;
    const ey = parsed?.endDate ? parsed.endDate.getFullYear() : null;
    if (sy != null) { yStart = Math.min(yStart, sy); }
    if (ey != null) { yEnd = Math.max(yEnd, ey); }
    return { site, cfg, sy, ey };
  });
  if (!isFinite(yStart) || !isFinite(yEnd) || yEnd < yStart) { yStart = curYear; yEnd = curYear + 24; }
  const lifetimeYears = yEnd - yStart + 1;
  const years: number[] = [];
  for (let y = yStart; y <= yEnd; y++) { years.push(y); }

  const rateOf = (cfg: BillingConfigModel | undefined, y: number) =>
    cfg ? rateForMonth(cfg.contactType, cfg.contactCost, y, 6) : null;
  const warrantyOf = (siteId: string, y: number) => slaValueForYear(slaByYear[siteId], y, 'energy_delivery');

  // ── cashflow ต่อ site (ตามช่วงสัญญาแต่ละ site) ────────────────────────────
  const siteCfs: SiteCashflow[] = contracts.filter(c => c.cfg).map(c => {
    const sy = c.sy ?? yStart;
    const ey = c.ey ?? yEnd;
    const capex = slaValueForYear(slaByYear[c.site.id], sy, 'capex');
    const revenueByYear: number[] = [];
    const opexByYear: (number | null)[] = [];
    const energyByYear: number[] = [];
    for (let y = sy; y <= ey; y++) {
      const rate = rateOf(c.cfg, y);
      const energy = warrantyOf(c.site.id, y);
      const opex = slaValueForYear(slaByYear[c.site.id], y, 'opex');
      const rev = rate != null && energy != null ? rate * energy : 0;
      revenueByYear.push(rev);
      energyByYear.push(energy ?? 0);
      opexByYear.push(opex);
    }
    return { site: c.site, cfg: c.cfg, startYear: sy, endYear: ey, capex, revenueByYear, opexByYear, energyByYear };
  });

  // ── ต่อ site: NPV/IRR/payback/LCOE ── โชว์ครบทุก site (ไม่มีข้อมูล = null → '---')
  const cfById = new Map(siteCfs.map(s => [s.site.id, s]));
  const emptyRow = (site: SiteModel): SiteFinancialRow => ({
    rank: 0, siteId: site.id, siteName: site.name,
    capex: null, opexAnnual: null, revenueAnnual: null, ebitda: null, irr: null, payback: null, lcoe: null
  });
  const siteRows: SiteFinancialRow[] = sites.map(site => {
    const s = cfById.get(site.id);
    if (!s) { return emptyRow(site); }
    const hasCost = s.capex != null && s.opexByYear.some(o => o != null);
    const revenueAnnual = s.revenueByYear.length
      ? (s.revenueByYear[Math.min(Math.max(curYear - s.startYear!, 0), s.revenueByYear.length - 1)] ?? null)
      : null;
    let irr: number | null = null, payback: number | null = null, lcoe: number | null = null, ebitda: number | null = null, opexAnnual: number | null = null;
    if (hasCost) {
      const nets = s.revenueByYear.map((rev, i) => rev - (s.opexByYear[i] ?? 0));
      irr = irrOf([-s.capex!, ...nets]);
      if (irr != null) { irr *= 100; }
      payback = paybackOf(s.capex!, nets);
      let cNum = s.capex!, cDen = 0;
      for (let i = 0; i < s.energyByYear.length; i++) {
        cNum += (s.opexByYear[i] ?? 0) / Math.pow(1 + discountRate, i + 1);
        cDen += s.energyByYear[i] / Math.pow(1 + discountRate, i + 1);
      }
      lcoe = cDen > 0 ? cNum / cDen : null;
      const idx = Math.min(Math.max(curYear - s.startYear!, 0), s.opexByYear.length - 1);
      opexAnnual = s.opexByYear[idx] ?? null;
      ebitda = revenueAnnual != null && opexAnnual != null ? revenueAnnual - opexAnnual : null;
    }
    return {
      rank: 0, siteId: s.site.id, siteName: s.site.name,
      capex: s.capex, opexAnnual, revenueAnnual: revenueAnnual && revenueAnnual > 0 ? revenueAnnual : null,
      ebitda, irr, payback, lcoe
    };
  });
  // rank by IRR (มีค่าก่อน, มาก→น้อย) — site ไม่มีค่าไปอยู่ล่างสุด
  siteRows.sort((a, b) => (b.irr ?? -Infinity) - (a.irr ?? -Infinity));
  siteRows.forEach((r, i) => r.rank = i + 1);

  // ── portfolio (รวมทั้งกลุ่ม ตาม calendar year span) ───────────────────────
  const capexTotal = siteCfs.reduce((sum, s) => sum + (s.capex ?? 0), 0);
  const anyCapex = siteCfs.some(s => s.capex != null);
  const anyOpex = siteCfs.some(s => s.opexByYear.some(o => o != null));
  const hasCost = anyCapex && anyOpex;

  const revByCal: number[] = years.map(() => 0);
  const opexByCal: number[] = years.map(() => 0);
  const energyByCal: number[] = years.map(() => 0);
  for (const s of siteCfs) {
    for (let i = 0; i < s.revenueByYear.length; i++) {
      const cal = (s.startYear! + i) - yStart;
      if (cal < 0 || cal >= years.length) { continue; }
      revByCal[cal] += s.revenueByYear[i];
      opexByCal[cal] += s.opexByYear[i] ?? 0;
      energyByCal[cal] += s.energyByYear[i];
    }
  }

  const lifetimeRevenue = revByCal.reduce((a, b) => a + b, 0);
  const lifetimeOpex = hasCost ? opexByCal.reduce((a, b) => a + b, 0) : null;
  const netsCal = revByCal.map((r, i) => r - opexByCal[i]);

  let npv: number | null = null, projectIrr: number | null = null, payback: number | null = null, discountedPayback: number | null = null, lcoe: number | null = null;
  const sensitivity: SensitivityPoint[] = [];
  const cashflowCumulative: number[] = [];
  let paybackYear: number | null = null;

  if (hasCost) {
    const cf = [-capexTotal, ...netsCal];
    npv = npvOf(cf, discountRate);
    projectIrr = irrOf(cf);
    if (projectIrr != null) { projectIrr *= 100; }
    payback = paybackOf(capexTotal, netsCal);
    discountedPayback = paybackOf(capexTotal, netsCal, discountRate);
    for (const r of DISCOUNT_RATES) { sensitivity.push({ rate: r, npv: npvOf(cf, r) }); }
    // LCOE portfolio (discounted)
    let cNum = capexTotal, cDen = 0;
    for (let i = 0; i < energyByCal.length; i++) {
      cNum += opexByCal[i] / Math.pow(1 + discountRate, i + 1);
      cDen += energyByCal[i] / Math.pow(1 + discountRate, i + 1);
    }
    lcoe = cDen > 0 ? cNum / cDen : null;
    // cumulative (undiscounted) สำหรับ break-even timeline
    let cum = -capexTotal;
    cashflowCumulative.push(cum);
    for (let i = 0; i < netsCal.length; i++) {
      const prev = cum; cum += netsCal[i]; cashflowCumulative.push(cum);
      if (paybackYear == null && cum >= 0) { paybackYear = i + (netsCal[i] > 0 ? (-prev) / netsCal[i] : 0); }
    }
  }

  const idxCur = Math.max(0, curYear - yStart);
  const revenueAnnual = revByCal[idxCur] ?? (revByCal.find(v => v > 0) ?? null);
  const opexAnnualCur = hasCost ? opexByCal[idxCur] : null;
  const ebitdaAnnual = revenueAnnual != null && opexAnnualCur != null ? revenueAnnual - opexAnnualCur : null;
  const ebitdaMargin = ebitdaAnnual != null && revenueAnnual ? (ebitdaAnnual / revenueAnnual) * 100 : null;
  const energyCur = energyByCal[idxCur] || 0;
  const opexPerKwh = opexAnnualCur != null && energyCur > 0 ? opexAnnualCur / energyCur : null;
  const totalCapacityMwp = sites.reduce((sum, s) => sum + (parseFloat(s.capacity) || 0), 0);
  const opexPerMwp = opexAnnualCur != null && totalCapacityMwp > 0 ? opexAnnualCur / totalCapacityMwp : null;

  const blendedTariffNow = energyCur > 0 ? revenueAnnual! / energyCur : null;
  const lcoeHeadroom = blendedTariffNow != null && lcoe != null ? blendedTariffNow - lcoe : null;
  const lcoeRatio = blendedTariffNow != null && lcoe != null && lcoe > 0 ? blendedTariffNow / lcoe : null;

  const netProfit = lifetimeOpex != null ? lifetimeRevenue - lifetimeOpex - capexTotal : null;

  // ── top strip (portfolio header) ──────────────────────────────────────────
  // PPA contract value = PV ของรายได้ตลอดสัญญา
  let contractValue = 0;
  for (let i = 0; i < revByCal.length; i++) { contractValue += revByCal[i] / Math.pow(1 + discountRate, i + 1); }

  // revenue YTD (actual จาก monthlyEnergy) + delivery
  let actRevYtd = 0, tgtRevYtd = 0, actEnergyYtd = 0, contractedEnergyYtd = 0;
  for (const s of siteCfs) {
    const warrCur = warrantyOf(s.site.id, curYear);
    const monthlyContracted = warrCur != null ? warrCur / 12 : null;
    const arr = monthlyEnergy[s.site.id];
    for (let m = 0; m <= curMonth; m++) {
      const rateM = rateOf(s.cfg, curYear);   // ใช้ rate ปีปัจจุบัน (kลางปี)
      const act = arr ? arr[m] : null;
      if (act != null && rateM != null) { actRevYtd += act * rateM; actEnergyYtd += act; }
      if (monthlyContracted != null) {
        contractedEnergyYtd += monthlyContracted;
        if (rateM != null) { tgtRevYtd += monthlyContracted * rateM; }
      }
    }
  }
  const revenueYtd = actRevYtd > 0 ? actRevYtd : null;
  const revenueYtdVsTargetPct = tgtRevYtd > 0 && actRevYtd > 0 ? (actRevYtd / tgtRevYtd - 1) * 100 : null;
  const deliveryPct = contractedEnergyYtd > 0 && actEnergyYtd > 0 ? (actEnergyYtd / contractedEnergyYtd) * 100 : null;

  // contract left (weighted by warranty) + COD ปีเริ่มเร็วสุด
  let clNum = 0, clDen = 0;
  for (const s of siteCfs) {
    const w = warrantyOf(s.site.id, curYear) ?? 0;
    if (s.endYear != null && w > 0) { clNum += Math.max(0, s.endYear - curYear) * w; clDen += w; }
  }
  const contractLeftYears = clDen > 0 ? clNum / clDen : null;
  let codYear: number | null = null;
  for (const s of sites) {
    const y = s.cod ? new Date(s.cod).getFullYear() : NaN;
    if (!isNaN(y) && (codYear == null || y < codYear)) { codYear = y; }
  }

  const waterfall: WaterfallStep[] = hasCost ? [
    { label: 'Revenue', value: lifetimeRevenue, kind: 'positive' },
    { label: 'OPEX', value: -(lifetimeOpex ?? 0), kind: 'negative' },
    { label: 'CAPEX', value: -capexTotal, kind: 'negative' },
    { label: 'Net profit', value: netProfit ?? 0, kind: 'total' }
  ] : [];

  return {
    hasData: siteCfs.length > 0,
    hasCost, discountRate, lifetimeYears,
    contractValue: lifetimeRevenue > 0 ? contractValue : null,
    avgTariff: blendedTariffNow,
    revenueYtd, revenueYtdVsTargetPct, deliveryPct,
    contractLeftYears, codYear,
    capex: anyCapex ? capexTotal : null,
    annualOpex: hasCost ? opexAnnualCur : null,
    npv, projectIrr, equityIrr: null, payback, discountedPayback, lcoe,
    revenueAnnual, ebitdaAnnual, ebitdaMargin, opexPerKwh, opexPerMwp,
    lifetimeRevenue, lifetimeOpex, netProfit,
    blendedTariffNow, lcoeHeadroom, lcoeRatio,
    waterfall, sensitivity, years, cashflowCumulative, paybackYear, siteRows
  };
}
