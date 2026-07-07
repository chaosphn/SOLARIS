import { parseContactCost } from './contract.model';

export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * tariff ที่ใช้จริงของ site ณ เดือน/ปีที่กำหนด
 * (PPA = rate ตามงวดปีที่ active, Floating = ค่าเฉลี่ยแบบ 4-month rolling)
 * ใช้ parseContactCost โดยส่ง "เวลาอ้างอิง" เป็นกลางเดือนนั้น
 */
export function rateForMonth(contactType: string, contactCost: string, year: number, monthIndex: number): number | null {
    const at = new Date(year, monthIndex, 15);
    const parsed = parseContactCost(contactType, contactCost, at);
    return parsed?.currentRate ?? null;
}

export interface RevMonthPoint {
    label: string;
    month: number;              // 0-11
    actual: number | null;      // ฿
    target: number;             // ฿
    forecast: number | null;    // ฿ (เฉพาะเดือนอนาคต)
    isFuture: boolean;
}

export interface SiteRevRow {
    siteId: string;
    siteName: string;
    type: string;               // PPA | FLOATING | ''
    isSchedule: boolean;
    thisMonth: number | null;   // ฿
    ytd: number | null;         // ฿
    target: number | null;      // ฿ (เดือนนี้)
    variancePct: number | null;
    status: 'above' | 'near' | 'below' | 'none';
    spark: number[];            // ฿ ย้อนหลังสูงสุด 6 เดือน
}
