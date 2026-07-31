/** ตัวช่วยตรวจค่าตัวเลขในฟอร์มตั้งค่า — ใช้ร่วมกันทุกหน้า setting/admin */

export interface NumberFieldRule {
  /** ชื่อที่แสดงในข้อความเตือน */
  label: string;
  value: any;
  /** ค่าต่ำสุดที่ยอมรับ ค่าเริ่มต้น 0 (ห้ามติดลบ) */
  min?: number;
  max?: number;
  /** true = ต้องกรอก ค่าว่างถือว่าผิด */
  required?: boolean;
}

/**
 * ตรวจรายการค่าตัวเลข คืนข้อความเตือนข้อแรกที่ผิด หรือ null เมื่อผ่านทั้งหมด
 * ช่องว่าง/undefined ถือว่าผ่านเมื่อไม่ได้ตั้ง required เพราะหลายฟอร์มปล่อยว่างได้
 */
export function validateNumberFields(rules: NumberFieldRule[]): string | null {
  for (const rule of rules) {
    const isBlank = rule.value === '' || rule.value === null || rule.value === undefined;

    if (isBlank) {
      if (rule.required) {
        return `กรุณากรอก ${rule.label}`;
      }
      continue;
    }

    const num = Number(rule.value);
    if (!Number.isFinite(num)) {
      return `${rule.label} ต้องเป็นตัวเลข`;
    }

    const min = rule.min ?? 0;
    if (num < min) {
      return min === 0
        ? `${rule.label} ต้องไม่ติดลบ (ค่าต่ำสุด 0)`
        : `${rule.label} ต้องไม่น้อยกว่า ${min}`;
    }

    if (rule.max !== undefined && num > rule.max) {
      return `${rule.label} ต้องไม่เกิน ${rule.max}`;
    }
  }
  return null;
}
