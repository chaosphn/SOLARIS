import { SiteModel } from '../../../shared/models/config.model';
import { PlantSlaModel } from '../../../shared/models/masterdata.model';
import { BillingConfigModel } from './billing.model';

/**
 * ชุดข้อมูลกลางของกลุ่ม PPA Analysis (contract / revenue / energy-delivery ใช้ร่วมกัน)
 * cache ไว้ใน ngrx store — สลับหน้าภายใน 2 นาที ไม่ยิง API ซ้ำ
 */
export interface PpaStateModel {
    siteList: SiteModel[];
    billingConfigs: BillingConfigModel[];
    slaData: Record<string, PlantSlaModel>;
    realtimeData: Record<string, number>;          // key = `${siteId}_${Title}` เช่น KKB_AVAI, KKB_PR_MONTH
    monthlyEnergy: Record<string, (number | null)[]>; // kWh ต่อเดือน (index 0-11 = Jan-Dec ปีปัจจุบัน)
    // SLA ตลอดอายุสัญญา (หลายปี) — โหลดแยกผ่าน ensureSlaHistory() ใช้โดย Tariff Escalation / Financial
    slaByYear: Record<string, Record<number, PlantSlaModel>>; // slaByYear[siteId][year]
    slaHistoryTimestamp: Date | null;
    timestamp: Date | null;
}
