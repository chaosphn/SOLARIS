import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { HttpService } from '../../../../../../shared/services/http.service';
import { sendMessage } from '../../../../../../store/actions/toaster.actions';
import { PlantInformationModel, PlantSlaModel } from '../../../../../../shared/models/masterdata.model';
import { validateNumberFields } from '../../../../../../shared/utils/number-validation';
import { Datetime } from '../../../../../../shared/services/datetime';

@Component({
  selector: 'app-plant-sla-dialog',
  standalone: false,
  templateUrl: './plant-sla-dialog.html',
  styleUrl: './plant-sla-dialog.scss'
})
export class PlantSlaDialog implements OnInit {

  slaList = input<PlantSlaModel[]>([]);
  slaData = input<PlantSlaModel>(this.getEmptySla());
  plants = input<PlantInformationModel[]>([]);
  readonly = input<boolean>(false);
  onClose = output();

  year = signal<number>(new Date().getFullYear());

  private store = inject(Store);
  private service = inject(HttpService);
  private dateTimeSrv = inject(Datetime);

  ngOnInit(): void {
    const ts = this.slaData().timestamp;
    if (ts) {
      const y = new Date(ts).getFullYear();
      this.year.set(Number.isFinite(y) ? y : Number(String(ts).slice(0, 4)) || new Date().getFullYear());
    }
  }

  getEmptySla(): PlantSlaModel {
    return {
      id: 0,
      siteid: '',
      timestamp: '',
      availability: undefined,
      performance: undefined,
      capex: undefined,
      opex: undefined,
      p50_yield: undefined,
      p90_yield: undefined,
      epc_energy_charge: undefined,
      epc_yield_guarantee: undefined,
      ppa_guaranteed_supply: undefined,
      ppa_expected_consumption: undefined,
      ppa_energy_charge: undefined,
      financial_model_yield: undefined
    } as PlantSlaModel;
  }

  closeModal(): void {
    this.onClose.emit();
  }

  /** เวลาแก้ไขล่าสุดจาก backend เป็น UTC — แสดงเป็นเวลาไทย */
  updatedAtText(): string {
    return this.dateTimeSrv.toBangkok(this.slaData().updated_at) || '---';
  }

  setYear(value: any): void {
    const n = Number(value);
    if (Number.isFinite(n)) this.year.set(n);
  }

  async submit(): Promise<void> {
    const s = this.slaData();
    if (!s.siteid || !s.siteid.trim()) {
      this.store.dispatch(sendMessage({ payload: { text: 'Please select Site ID', type: 'warn' } }));
      return;
    }
    if (!this.year() || this.year() < 1990 || this.year() > 9999) {
      this.store.dispatch(sendMessage({ payload: { text: 'Please enter a valid year', type: 'warn' } }));
      return;
    }
    const numberError = validateNumberFields([
      { label: 'Availability (%)', value: s.availability, max: 100 },
      { label: 'Performance (%)', value: s.performance, max: 100 },
      { label: 'CAPEX', value: s.capex },
      { label: 'OPEX', value: s.opex },
      { label: 'P50 Yield', value: s.p50_yield },
      { label: 'P90 Yield', value: s.p90_yield },
      { label: 'EPC Energy Charge', value: s.epc_energy_charge },
      { label: 'EPC Yield Guarantee', value: s.epc_yield_guarantee },
      { label: 'PPA Guaranteed Supply', value: s.ppa_guaranteed_supply },
      { label: 'PPA Expected Consumption', value: s.ppa_expected_consumption },
      { label: 'PPA Energy Charge', value: s.ppa_energy_charge },
      { label: 'Financial Model Yield', value: s.financial_model_yield }
    ]);
    if (numberError) {
      this.store.dispatch(sendMessage({ payload: { text: numberError, type: 'warn' } }));
      return;
    }
    if (s.id) {
      await this.editSubmit();
    } else {
      await this.addSubmit();
    }
  }

  private async addSubmit(): Promise<void> {
    const s = this.slaData();
    const dup = this.slaList().some(x => x.siteid === s.siteid && this.yearOf(x.timestamp) === this.year());
    if (dup) {
      this.store.dispatch(sendMessage({ payload: { text: `SLA for '${s.siteid}' year ${this.year()} already exists`, type: 'warn' } }));
      return;
    }
    const body = { ...this.buildBody(s), updated_by: this.currentUser() };
    const response = await this.service.createSla(body as any);
    if (response && response.status === 'success') {
      this.store.dispatch(sendMessage({ payload: { text: 'SLA added successfully', type: 'success' } }));
      this.closeModal();
    } else {
      this.store.dispatch(sendMessage({ payload: { text: response?.message || 'Failed to add SLA', type: 'error' } }));
    }
  }

  private async editSubmit(): Promise<void> {
    const s = this.slaData();
    const body = { ...this.buildBody(s), id: s.id, updated_by: this.currentUser() };
    const response = await this.service.updateSla(body as any);
    if (response && response.status === 'success') {
      this.store.dispatch(sendMessage({ payload: { text: 'SLA updated successfully', type: 'success' } }));
      this.closeModal();
    } else {
      this.store.dispatch(sendMessage({ payload: { text: response?.message || 'Failed to update SLA', type: 'error' } }));
    }
  }

  private buildBody(s: PlantSlaModel) {
    return {
      siteid: s.siteid,
      timestamp: `${this.year()}-01-01 00:00:00`,
      availability: this.toNum(s.availability),
      performance: this.toNum(s.performance),
      capex: this.toNum(s.capex),
      opex: this.toNum(s.opex),
      p50_yield: this.toNum(s.p50_yield),
      p90_yield: this.toNum(s.p90_yield),
      epc_energy_charge: this.toNum(s.epc_energy_charge),
      epc_yield_guarantee: this.toNum(s.epc_yield_guarantee),
      ppa_guaranteed_supply: this.toNum(s.ppa_guaranteed_supply),
      ppa_expected_consumption: this.toNum(s.ppa_expected_consumption),
      ppa_energy_charge: this.toNum(s.ppa_energy_charge),
      financial_model_yield: this.toNum(s.financial_model_yield)
    };
  }

  private yearOf(ts?: string): number {
    if (!ts) return 0;
    const y = new Date(ts).getFullYear();
    return Number.isFinite(y) ? y : Number(String(ts).slice(0, 4)) || 0;
  }

  private toNum(v: any): number | undefined {
    if (v === '' || v === null || v === undefined) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }

  private currentUser(): string | undefined {
    // ตอน login เก็บชื่อผู้ใช้ไว้ที่ key 'user' (ไม่ใช่ 'username') — ใช้ผิด key ทำให้ updated_by เป็น undefined เสมอ
    return localStorage.getItem('user') || undefined;
  }
}
