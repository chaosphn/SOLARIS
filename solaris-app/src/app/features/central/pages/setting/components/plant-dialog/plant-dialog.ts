import { Component, inject, input, output } from '@angular/core';
import { Store } from '@ngrx/store';
import { HttpService } from '../../../../../../shared/services/http.service';
import { sendMessage } from '../../../../../../store/actions/toaster.actions';
import { PlantInformationModel } from '../../../../../../shared/models/masterdata.model';
import { validateNumberFields } from '../../../../../../shared/utils/number-validation';

@Component({
  selector: 'app-plant-dialog',
  standalone: false,
  templateUrl: './plant-dialog.html',
  styleUrl: './plant-dialog.scss'
})
export class PlantDialog {

  plantList = input<PlantInformationModel[]>([]);
  plantData = input<PlantInformationModel>(this.getEmptyPlant());
  readonly = input<boolean>(false);
  onClose = output();

  private store = inject(Store);
  private service = inject(HttpService);

  getEmptyPlant(): PlantInformationModel {
    return {
      id: 0,
      enable: 1,
      siteid: '',
      name: '',
      project: '',
      location: '',
      company: '',
      company_th: '',
      branch: '',
      address: '',
      address_th: '',
      taxid: '',
      position_lat: undefined,
      position_long: undefined,
      capacity: undefined,
      capacity_dc: undefined,
      cod: '',
      group: ''
    } as PlantInformationModel;
  }

  closeModal(): void {
    this.onClose.emit();
  }

  setEnable(checked: boolean): void {
    this.plantData().enable = checked ? 1 : 0;
  }

  async submit(): Promise<void> {
    const p = this.plantData();
    if (!p.siteid || !p.siteid.trim()) {
      this.store.dispatch(sendMessage({ payload: { text: 'Please enter Site ID', type: 'warn' } }));
      return;
    }
    const numberError = validateNumberFields([
      { label: 'Capacity (MWp)', value: p.capacity },
      { label: 'Capacity DC (MWp)', value: p.capacity_dc },
      { label: 'Latitude', value: p.position_lat, min: -90, max: 90 },
      { label: 'Longitude', value: p.position_long, min: -180, max: 180 }
    ]);
    if (numberError) {
      this.store.dispatch(sendMessage({ payload: { text: numberError, type: 'warn' } }));
      return;
    }
    if (p.id) {
      await this.editSubmit();
    } else {
      await this.addSubmit();
    }
  }

  private async addSubmit(): Promise<void> {
    const p = this.plantData();
    const dup = this.plantList().some(x => (x.siteid || '').toLowerCase() === p.siteid.toLowerCase());
    if (dup) {
      this.store.dispatch(sendMessage({ payload: { text: `Site ID '${p.siteid}' already exists`, type: 'warn' } }));
      return;
    }
    const body = { ...this.buildBody(p), updated_by: this.currentUser() };
    const response = await this.service.createPlant(body as any);
    if (response && response.status === 'success') {
      this.store.dispatch(sendMessage({ payload: { text: 'Plant added successfully', type: 'success' } }));
      this.closeModal();
    } else {
      this.store.dispatch(sendMessage({ payload: { text: response?.message || 'Failed to add plant', type: 'error' } }));
    }
  }

  private async editSubmit(): Promise<void> {
    const p = this.plantData();
    const body = { ...this.buildBody(p), id: p.id, updated_by: this.currentUser() };
    const response = await this.service.updatePlant(body as any);
    if (response && response.status === 'success') {
      this.store.dispatch(sendMessage({ payload: { text: 'Plant updated successfully', type: 'success' } }));
      this.closeModal();
    } else {
      this.store.dispatch(sendMessage({ payload: { text: response?.message || 'Failed to update plant', type: 'error' } }));
    }
  }

  private buildBody(p: PlantInformationModel) {
    return {
      siteid: p.siteid?.trim(),
      enable: p.enable ? 1 : 0,
      name: p.name,
      project: p.project,
      location: p.location,
      company: p.company,
      company_th: p.company_th,
      branch: p.branch,
      address: p.address,
      address_th: p.address_th,
      taxid: p.taxid,
      position_lat: this.toNum(p.position_lat),
      position_long: this.toNum(p.position_long),
      capacity: this.toNum(p.capacity),
      capacity_dc: this.toNum(p.capacity_dc),
      cod: p.cod,
      group: p.group
    };
  }

  private toNum(v: any): number | undefined {
    if (v === '' || v === null || v === undefined) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }

  private currentUser(): string | undefined {
    // ตอน login เก็บชื่อผู้ใช้ไว้ที่ key 'user' (ไม่ใช่ 'username')
    return localStorage.getItem('user') || undefined;
  }
}
