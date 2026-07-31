import { SiteModel } from '../../../shared/models/config.model';
import { PlantSlaModel } from '../../../shared/models/masterdata.model';
import { BillingConfigModel, BillingStateDataModel } from './billing.model';
import { rateForMonth } from './revenue-performance.model';

export const ENERGY_TARGET_PCT = 95;

export type SlaStatus = 'met' | 'warning' | 'breach' | 'none';
// สอดคล้องกับ billing: status = prepared|onprogress|complete|delay, stage = billing_process
export type BillStatus = 'complete' | 'confirmation' | 'invoice' | 'payment' | 'receipt' | 'delay' | 'rejected' | 'none';

export const BILL_STATUS_LABEL: Record<BillStatus, string> = {
  complete: 'Completed', confirmation: 'Confirmation', invoice: 'Invoice',
  payment: 'Payment', receipt: 'Receipt', delay: 'Delayed', rejected: 'Rejected', none: 'Not started'
};

export interface ReportRow {
  siteId: string;
  siteName: string;
  guaranteed: number | null;   // kWh (warranty/12)
  actual: number | null;       // kWh (billed energy)
  achievement: number | null;  // %
  amount: number | null;       // ฿ (billed)
  penalty: number;
  bonus: number;
  slaStatus: SlaStatus;
  billStatus: BillStatus;
  updated: string | null;
}

export interface ReportSummary {
  totalGuaranteed: number;
  totalActual: number;
  achievement: number | null;
  totalAmount: number;
  trackedSites: number;
  compliantSites: number;
  warningSites: number;
  breachSites: number;
  penaltyTotal: number;
  bonusTotal: number;
  netSla: number;
  completedCount: number;
  billedSites: number;
  notBilled: number;
  outstanding: number;
}

export interface DeliveryReport {
  hasData: boolean;
  rows: ReportRow[];
  summary: ReportSummary;
}

/** เวลาอัปเดตล่าสุด = ค่ามากสุดของ *_updateAt ในสายงาน (fallback createdAt) */
function latestUpdate(b: BillingStateDataModel): string | null {
  const times = [b.confirmation_updateAt, b.invoice_updateAt, b.payment_updateAt, b.reciept_updateAt, b.createdAt]
    .filter((x): x is string => !!x)
    .sort((a, z) => new Date(z).getTime() - new Date(a).getTime());
  return times[0] ?? null;
}

/** ค่า energy ที่เรียกเก็บจริง = forced ถ้ามี (override) ไม่งั้น energy_amount */
function billedEnergy(b: BillingStateDataModel): number | null {
  if (b.forced_energy_amount != null && b.forced_energy_amount > 0) { return b.forced_energy_amount; }
  return b.energy_amount != null ? b.energy_amount : null;
}

/** สถานะบิล = field `status` ของ billing (complete/delay) + stage `billing_process` ปัจจุบัน */
export function deriveBillStatus(b: BillingStateDataModel | undefined): BillStatus {
  if (!b) { return 'none'; }
  const cur = (b.billing_process || '').toLowerCase();
  const curStatus = cur === 'confirmation' ? b.confirmation_status
    : cur === 'invoice' ? b.invoice_status
    : cur === 'payment' ? b.payment_status
    : cur === 'receipt' ? b.reciept_status : '';
  if ((curStatus || '').toLowerCase().includes('reject')) { return 'rejected'; }
  const st = (b.status || '').toLowerCase();
  if (st === 'complete') { return 'complete'; }
  if (st === 'delay') { return 'delay'; }
  if (cur === 'confirmation' || cur === 'invoice' || cur === 'payment' || cur === 'receipt') { return cur as BillStatus; }
  return 'confirmation';
}

function slaStatusOf(achievement: number | null): SlaStatus {
  if (achievement == null) { return 'none'; }
  if (achievement >= ENERGY_TARGET_PCT) { return 'met'; }
  if (achievement >= 90) { return 'warning'; }
  return 'breach';
}

export function buildDeliveryReport(
  sites: SiteModel[],
  slaData: Record<string, PlantSlaModel>,
  configs: BillingConfigModel[],
  billingState: BillingStateDataModel[],
  month: Date
): DeliveryReport {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  // bill ล่าสุดต่อ site (เผื่อมีหลาย record ในเดือน)
  const billBySite = new Map<string, BillingStateDataModel>();
  for (const b of billingState) {
    const prev = billBySite.get(b.siteId);
    if (!prev || new Date(b.timestamp).getTime() >= new Date(prev.timestamp).getTime()) {
      billBySite.set(b.siteId, b);
    }
  }

  const rows: ReportRow[] = sites.map(s => {
    const warrEnergy = slaData[s.id]?.financial_model_yield ?? null;
    const guaranteed = warrEnergy != null ? warrEnergy / 12 : null;
    const bill = billBySite.get(s.id);
    const actual = bill ? billedEnergy(bill) : null;
    const amount = bill?.price_amount ?? null;
    const achievement = actual != null && guaranteed != null && guaranteed > 0 ? (actual / guaranteed) * 100 : null;

    const cfg = configs.find(c => c.siteId === s.id);
    const rate = cfg ? rateForMonth(cfg.contactType, cfg.contactCost, year, monthIndex) : null;
    let penalty = 0, bonus = 0;
    if (actual != null && guaranteed != null && rate != null) {
      if (actual < guaranteed) { penalty = (guaranteed - actual) * rate; }
      else { bonus = (actual - guaranteed) * rate; }
    }

    return {
      siteId: s.id, siteName: s.name,
      guaranteed, actual, achievement, amount, penalty, bonus,
      slaStatus: slaStatusOf(achievement),
      billStatus: deriveBillStatus(bill),
      updated: bill ? latestUpdate(bill) : null
    };
  });

  // เรียง worst first (breach → warning → met → none), แล้ว achievement น้อย→มาก
  const order: Record<SlaStatus, number> = { breach: 0, warning: 1, met: 2, none: 3 };
  rows.sort((a, b) => order[a.slaStatus] - order[b.slaStatus] || (a.achievement ?? 9999) - (b.achievement ?? 9999));

  const tracked = rows.filter(r => r.guaranteed != null);
  const summary: ReportSummary = {
    totalGuaranteed: tracked.reduce((a, r) => a + (r.guaranteed ?? 0), 0),
    totalActual: rows.reduce((a, r) => a + (r.actual ?? 0), 0),
    achievement: null,
    totalAmount: rows.reduce((a, r) => a + (r.amount ?? 0), 0),
    trackedSites: tracked.length,
    compliantSites: rows.filter(r => r.slaStatus === 'met').length,
    warningSites: rows.filter(r => r.slaStatus === 'warning').length,
    breachSites: rows.filter(r => r.slaStatus === 'breach').length,
    penaltyTotal: rows.reduce((a, r) => a + r.penalty, 0),
    bonusTotal: rows.reduce((a, r) => a + r.bonus, 0),
    netSla: 0,
    completedCount: rows.filter(r => r.billStatus === 'complete').length,
    billedSites: rows.filter(r => r.billStatus !== 'none').length,
    notBilled: rows.filter(r => r.billStatus === 'none').length,
    outstanding: rows.filter(r => r.billStatus !== 'none' && r.billStatus !== 'complete' && r.billStatus !== 'rejected').reduce((a, r) => a + (r.amount ?? 0), 0)
  };
  summary.achievement = summary.totalGuaranteed > 0 ? (summary.totalActual / summary.totalGuaranteed) * 100 : null;
  summary.netSla = summary.bonusTotal - summary.penaltyTotal;

  return { hasData: rows.length > 0, rows, summary };
}
