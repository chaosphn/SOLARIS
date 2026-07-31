import { Component, computed, input } from '@angular/core';
import { CALC_GLOSSARY } from '../../models/calc-glossary';

/**
 * ไอคอน ⓘ ข้างชื่อค่า — hover แล้วบอกว่าตัวเลขคำนวณยังไงและข้อมูลมาจากไหน
 * ใช้: <app-info-hint hint="npv"></app-info-hint>
 */
@Component({
  selector: 'app-info-hint',
  standalone: false,
  templateUrl: './info-hint.html',
  styleUrl: './info-hint.scss'
})
export class InfoHint {
  /** key ใน CALC_GLOSSARY */
  hint = input<string>('');
  /** ใช้ข้อความเองแทน glossary ได้ กรณีค่าเฉพาะหน้าใดหน้าหนึ่ง */
  text = input<string>('');

  tooltip = computed<string>(() => {
    if (this.text()) {
      return this.text();
    }
    const entry = CALC_GLOSSARY[this.hint()];
    if (!entry) {
      return '';
    }
    return entry.source
      ? `${entry.formula}\nที่มา: ${entry.source}`
      : entry.formula;
  });
}
