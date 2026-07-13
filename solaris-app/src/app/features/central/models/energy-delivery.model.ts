export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export type ComplianceStatus = 'met' | 'warn-energy' | 'warn-avail' | 'breach' | 'none';

export interface DeliveryMonthPoint {
    label: string;
    month: number;
    actual: number | null;   // kWh (null = ยังไม่ถึงเดือน)
    contracted: number;      // kWh
    isFuture: boolean;
}

export interface SiteComplianceRow {
    siteId: string;
    siteName: string;
    actual: number | null;        // kWh เดือนนี้
    contracted: number | null;    // kWh เดือนนี้ (warranty/12)
    achievement: number | null;   // %
    availability: number | null;  // % จริง (AVAI)
    availWarranty: number | null; // % จาก SLA
    shortfall: number;            // kWh เดือนนี้
    penalty: number;              // ฿ (energy LD)
    status: ComplianceStatus;
    spark: number[];              // achievement % ย้อนหลังสูงสุด 6 เดือน
}

export interface HeatmapRow {
    siteId: string;
    cells: (number | null)[];     // achievement % ต่อเดือน (12)
}

/**
 * สถานะ compliance ต่อ site:
 *  - breach     = พลังงานต่ำกว่า 90% ของสัญญา
 *  - warn-energy= พลังงาน 90–100%
 *  - warn-avail = พลังงานผ่าน แต่ availability ต่ำกว่า warranty
 *  - met        = ผ่านทั้งพลังงานและ availability
 */
export function complianceStatus(achievement: number | null, avai: number | null, availWarranty: number | null): ComplianceStatus {
    if (achievement == null) { return 'none'; }
    if (achievement < 90) { return 'breach'; }
    if (achievement < 100) { return 'warn-energy'; }
    if (avai != null && availWarranty != null && avai < availWarranty) { return 'warn-avail'; }
    return 'met';
}

/** achievement % → สีสำหรับ heatmap */
export function heatColor(pct: number | null): string {
    if (pct == null) { return '#3B444D'; }
    if (pct >= 100) { return '#4CAF82'; }
    if (pct >= 90) { return '#FBE134'; }
    return '#E05D4E';
}
