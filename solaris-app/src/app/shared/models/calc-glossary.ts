/**
 * คำอธิบายวิธีคำนวณของทุกค่าในกลุ่มหน้า FINANCIAL & PPA
 * ใช้ผ่าน <app-info-hint hint="<key>"> เพื่อให้ผู้ใช้กดดูได้ว่าตัวเลขมาจากไหน
 *
 * formula = สูตร/นิยาม · source = ข้อมูลตั้งต้นมาจากไหน (ช่วยตอบเวลาค่าว่าง)
 */
export interface CalcHint {
  label: string;
  formula: string;
  source?: string;
}

export const CALC_GLOSSARY: Record<string, CalcHint> = {

  // ─── Contract (PPA) ─────────────────────────────────────────────────────────
  'total-contract': {
    label: 'TOTAL CONTRACT',
    formula: 'จำนวนไซต์ที่มีสัญญา แยกเป็น PPA และ Floating Rate',
    source: 'ประเภทสัญญาจาก Billing Setting ของแต่ละไซต์'
  },
  'all-plant-capacity': {
    label: 'ALL PLANT CAPACITY',
    formula: 'ผลรวมกำลังผลิตติดตั้งของทุกไซต์ (MWp)',
    source: 'ค่า Capacity จากหน้า Setting › Plants'
  },
  'avg-tariff': {
    label: 'AVG TARIFF',
    formula: 'ค่าไฟเฉลี่ยของงวดปัจจุบัน = ผลรวมอัตราค่าไฟทุกไซต์ ÷ จำนวนไซต์ที่มีสัญญา',
    source: 'Contract Cost ของงวดปัจจุบัน (Billing Setting)'
  },
  'avg-contract-progress': {
    label: 'AVG CONTRACT PROGRESS',
    formula: 'ความคืบหน้าสัญญาเฉลี่ย · PPA = ระยะเวลาที่ผ่านไป ÷ อายุสัญญาทั้งหมด · Floating = สัดส่วนของรอบปีปัจจุบัน',
    source: 'วัน COD และอายุสัญญาของแต่ละไซต์'
  },
  'total-revenue-month': {
    label: 'TOTAL REVENUE THIS MONTH',
    formula: 'รายได้เดือนนี้รวมทุกไซต์ = พลังงานสะสมเดือนนี้ (MTD) × อัตราค่าไฟของงวด',
    source: 'พลังงาน MTD จากมิเตอร์ + Contract Cost'
  },
  'warranty-yr': {
    label: 'WARRANTY / YR',
    formula: 'พลังงานที่รับประกันต่อปีตามสัญญา (kWh/ปี)',
    source: 'PPA Guaranteed Supply จาก SLA Setting'
  },
  'produced-ytd': {
    label: 'PRODUCED YTD',
    formula: 'พลังงานที่ผลิตได้จริงสะสมตั้งแต่ต้นปี (kWh)',
    source: 'ค่าสะสมรายปีจากมิเตอร์'
  },

  // ─── Revenue Performance ────────────────────────────────────────────────────
  'mtd-revenue': {
    label: 'MTD REVENUE',
    formula: 'รายได้สะสมเดือนนี้ = พลังงานที่ส่งมอบเดือนนี้ × อัตราค่าไฟของงวด',
    source: 'พลังงานรายเดือน + Contract Cost'
  },
  'ytd-revenue': {
    label: 'YTD REVENUE',
    formula: 'รายได้สะสมตั้งแต่ต้นปี = ผลรวมรายได้รายเดือนของปีนี้',
    source: 'พลังงานรายเดือน + Contract Cost ของแต่ละงวด'
  },
  'achievement': {
    label: 'ACHIEVEMENT',
    formula: 'รายได้จริง YTD ÷ แผนรายได้ YTD × 100',
    source: 'แผนรายได้คำนวณจาก Financial Model Yield × tariff'
  },
  'annual-forecast': {
    label: 'ANNUAL FORECAST',
    formula: 'คาดการณ์รายได้ทั้งปี = รายได้จริง YTD + ประมาณการของเดือนที่เหลือ',
    source: 'ประมาณการอิงค่าเฉลี่ยที่ทำได้จริงในปีนี้'
  },
  'revenue-at-risk': {
    label: 'REVENUE AT RISK',
    formula: 'มูลค่ารายได้ที่เสียไปจากช่วงหยุดจ่าย = พลังงานที่หายไป × อัตราค่าไฟ',
    source: 'พลังงานที่หายไปประเมินจาก % downtime'
  },
  'blended-tariff': {
    label: 'BLENDED TARIFF',
    formula: 'ค่าไฟเฉลี่ยถ่วงน้ำหนักทั้ง portfolio = รายได้รวม ÷ พลังงานรวม (฿/kWh)',
    source: 'รวมทุกไซต์ทั้ง PPA และ Floating'
  },

  // ─── Energy Delivery ────────────────────────────────────────────────────────
  'energy-achievement': {
    label: 'ENERGY ACHIEVEMENT',
    formula: 'พลังงานที่ส่งมอบจริง ÷ พลังงานตามสัญญา × 100',
    source: 'พลังงานตามสัญญาจาก PPA Guaranteed Supply (SLA Setting)'
  },
  'availability': {
    label: 'AVAILABILITY',
    formula: 'สัดส่วนเวลาที่ระบบพร้อมจ่ายไฟ ÷ เวลาทั้งหมดในช่วงนั้น × 100',
    source: 'คำนวณจากสถานะอุปกรณ์ เทียบเกณฑ์ Availability ใน SLA Setting'
  },
  'performance-pr': {
    label: 'PERFORMANCE (PR)',
    formula: 'Performance Ratio = พลังงานที่ผลิตได้จริง ÷ พลังงานตามทฤษฎี (ความเข้มแสง × กำลังติดตั้ง) × 100',
    source: 'ความเข้มแสงจาก Pyranometer ของแต่ละไซต์'
  },
  'compliant-sites': {
    label: 'COMPLIANT SITES',
    formula: 'จำนวนไซต์ที่ผ่านเกณฑ์ SLA ครบทุกข้อ เทียบกับจำนวนไซต์ทั้งหมด',
    source: 'เกณฑ์จาก SLA Setting (Availability / Performance / Energy)'
  },
  'shortfall-ytd': {
    label: 'SHORTFALL · YTD',
    formula: 'พลังงานที่ส่งขาดจากสัญญาสะสมทั้งปี = Σ (พลังงานตามสัญญา − พลังงานจริง) เฉพาะงวดที่ส่งไม่ถึง',
    source: 'เทียบรายเดือนกับ PPA Guaranteed Supply'
  },
  'penalty-ytd': {
    label: 'PENALTY · YTD',
    formula: 'ค่าปรับสะสมจากการส่งพลังงานไม่ถึงเกณฑ์ = พลังงานที่ขาด × อัตราค่าปรับตามสัญญา',
    source: 'เงื่อนไขค่าปรับจากสัญญา PPA'
  },

  // ─── Tariff Escalation ──────────────────────────────────────────────────────
  'blended-tariff-now': {
    label: 'BLENDED TARIFF · NOW',
    formula: 'ค่าไฟเฉลี่ยถ่วงน้ำหนักของงวดปัจจุบัน (฿/kWh)',
    source: 'ตาราง Contract Cost ปีปัจจุบันของทุกไซต์'
  },
  'next-escalation': {
    label: 'NEXT ESCALATION',
    formula: 'การปรับขึ้นอัตราค่าไฟครั้งถัดไปตามสัญญา พร้อมปีที่จะมีผล',
    source: 'ตาราง Contract Cost รายปี'
  },
  'avg-annual-escalation': {
    label: 'AVG ANNUAL ESCALATION',
    formula: 'อัตราการปรับขึ้นเฉลี่ยต่อปีตลอดอายุสัญญา (%)',
    source: 'คำนวณจากอัตราปีแรกถึงปีสุดท้ายในตาราง Contract Cost'
  },
  'tariff-range': {
    label: 'TARIFF RANGE',
    formula: 'อัตราค่าไฟต่ำสุดถึงสูงสุดตลอดอายุสัญญา (฿/kWh)',
    source: 'ตาราง Contract Cost ทุกปีของทุกไซต์'
  },
  'lifetime-growth': {
    label: 'LIFETIME GROWTH',
    formula: 'อัตราค่าไฟปีสุดท้าย ÷ ปีแรก − 100 (% การเติบโตรวมตลอดสัญญา)',
    source: 'ตาราง Contract Cost'
  },
  'contract-types': {
    label: 'CONTRACT TYPES',
    formula: 'จำนวนไซต์แยกตามประเภทสัญญา PPA และ Floating Rate',
    source: 'Billing Setting ของแต่ละไซต์'
  },

  // ─── SLA Compliance ─────────────────────────────────────────────────────────
  'energy-delivery-sla': {
    label: 'ENERGY DELIVERY',
    formula: 'พลังงานที่ส่งมอบจริง ÷ พลังงานที่รับประกัน × 100 เทียบกับเกณฑ์ในสัญญา',
    source: 'เกณฑ์จาก SLA Setting'
  },
  'ppa-health-score': {
    label: 'PPA HEALTH SCORE',
    formula: 'คะแนนรวมสุขภาพสัญญา ถ่วงน้ำหนักจาก Availability · PR · Energy Delivery',
    source: 'เป็นค่าประมาณ (proxy) ยังไม่ใช่สูตรตามสัญญาอย่างเป็นทางการ'
  },
  'penalty-bonus': {
    label: 'PENALTY · BONUS',
    formula: 'ค่าปรับจากการส่งไม่ถึงเกณฑ์ และโบนัสจากการส่งเกินเกณฑ์ ตามเงื่อนไขสัญญา',
    source: 'เกณฑ์และอัตราจาก SLA Setting + สัญญา PPA'
  },

  // ─── Financial Analysis ─────────────────────────────────────────────────────
  'ppa-contract-value': {
    label: 'PPA CONTRACT VALUE',
    formula: 'มูลค่าสัญญาคิดลดตลอดอายุ = Σ (รายได้ของปีนั้น ÷ (1 + อัตราคิดลด)^ปี)',
    source: 'รายได้รายปี = พลังงานที่รับประกัน × tariff ของปีนั้น'
  },
  'revenue-ytd': {
    label: 'REVENUE YTD',
    formula: 'รายได้สะสมตั้งแต่ต้นปีของทุกไซต์',
    source: 'พลังงานรายเดือน × tariff ของแต่ละงวด'
  },
  'delivery-ytd': {
    label: 'DELIVERY YTD',
    formula: 'พลังงานที่ส่งจริงสะสม ÷ พลังงานตามสัญญาสะสม × 100',
    source: 'เทียบกับ PPA Guaranteed Supply'
  },
  'project-irr': {
    label: 'PROJECT IRR',
    formula: 'อัตราคิดลดที่ทำให้ NPV = 0 (แก้เชิงตัวเลขจากกระแสเงินสดตลอดอายุโครงการ)',
    source: 'ต้องมี CAPEX และ OPEX ใน SLA Setting จึงจะคำนวณได้'
  },
  'contract-left': {
    label: 'CONTRACT LEFT',
    formula: 'จำนวนปีที่เหลือของสัญญา = อายุสัญญา − ระยะเวลาที่ผ่านไปนับจาก COD',
    source: 'วัน COD จาก Setting › Plants'
  },
  'npv': {
    label: 'NPV',
    formula: 'มูลค่าปัจจุบันสุทธิ = Σ (กระแสเงินสดปีนั้น ÷ (1 + อัตราคิดลด)^ปี) − CAPEX',
    source: 'CAPEX / OPEX จาก SLA Setting · กระแสเงินสด = รายได้ − OPEX'
  },
  'payback': {
    label: 'PAYBACK',
    formula: 'ปีที่กระแสเงินสดสะสมกลับมาเป็นบวก (ตัดเส้นศูนย์)',
    source: 'ค่าคิดลดแล้วคำนวณแยกเป็น Discounted Payback'
  },
  'lcoe': {
    label: 'LCOE',
    formula: 'ต้นทุนต่อหน่วยตลอดอายุ = (CAPEX + Σ OPEX คิดลด) ÷ Σ พลังงานคิดลด (฿/kWh)',
    source: 'ต้องมี CAPEX และ OPEX ใน SLA Setting'
  },
  'ebitda': {
    label: 'EBITDA',
    formula: 'กำไรก่อนดอกเบี้ย ภาษี ค่าเสื่อม = รายได้ต่อปี − OPEX ต่อปี',
    source: 'OPEX จาก SLA Setting'
  },

  // ─── Delivery Report (Bill Report) ──────────────────────────────────────────
  'guaranteed-actual': {
    label: 'GUARANTEED → ACTUAL',
    formula: 'พลังงานที่รับประกันตามสัญญา เทียบกับพลังงานที่ส่งมอบจริงในงวดนั้น',
    source: 'PPA Guaranteed Supply (SLA Setting) + มิเตอร์'
  },
  'total-amount': {
    label: 'TOTAL AMOUNT',
    formula: 'ยอดเงินรวมของงวด = พลังงานที่ส่งมอบ × อัตราค่าไฟ (ก่อน VAT)',
    source: 'ข้อมูลจากระบบ Billing'
  },
  'sla-compliant': {
    label: 'SLA COMPLIANT',
    formula: 'จำนวนไซต์ที่ผ่านเกณฑ์ SLA ในงวดนี้ เทียบกับไซต์ทั้งหมด',
    source: 'เกณฑ์จาก SLA Setting'
  },
  'completed-outstanding': {
    label: 'COMPLETED · OUTSTANDING',
    formula: 'จำนวนงวดที่ปิดครบขั้นตอนแล้ว เทียบกับงวดที่ยังค้างอยู่ในกระบวนการ',
    source: 'สถานะจากระบบ Billing'
  }
};
