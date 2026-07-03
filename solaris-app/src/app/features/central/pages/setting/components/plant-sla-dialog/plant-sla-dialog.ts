import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { HttpService } from '../../../../../../shared/services/http.service';
import { sendMessage } from '../../../../../../store/actions/toaster.actions';
import { PlantInformationModel, PlantSlaModel } from '../../../../../../shared/models/masterdata.model';

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
      energy_delivery: undefined,
      availability: undefined,
      performance: undefined,
      capex: undefined,
      opex: undefined
    } as PlantSlaModel;
  }

  closeModal(): void {
    this.onClose.emit();
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
      energy_delivery: this.toNum(s.energy_delivery),
      availability: this.toNum(s.availability),
      performance: this.toNum(s.performance),
      capex: this.toNum(s.capex),
      opex: this.toNum(s.opex)
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
    return localStorage.getItem('username') || undefined;
  }
}
