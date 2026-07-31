import { createAction, props } from '@ngrx/store';

/** หน้าที่โหลดข้อมูลเสร็จแล้ว dispatch อันนี้เพื่อให้ navbar แสดงเวลาอัปเดตล่าสุด */
export const setLastUpdate = createAction(
  '[LastUpdate] Set',
  props<{ payload: { timestamp: Date; intervalMs?: number } }>()
);

/** ล้างค่าเมื่อออกจากหน้าที่ไม่มีการรีเฟรชอัตโนมัติ */
export const clearLastUpdate = createAction('[LastUpdate] Clear');
