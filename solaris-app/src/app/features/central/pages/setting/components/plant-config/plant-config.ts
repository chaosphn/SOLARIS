import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { HttpService } from '../../../../../../shared/services/http.service';
import { sendMessage } from '../../../../../../store/actions/toaster.actions';
import { ConfirmDialog, ConfirmDialogData } from '../../../../../../shared/components/confirm-dialog/confirm-dialog';
import { PlantInformationModel } from '../../../../../../shared/models/masterdata.model';

@Component({
  selector: 'app-plant-config',
  standalone: false,
  templateUrl: './plant-config.html',
  styleUrl: './plant-config.scss'
})
export class PlantConfig implements OnInit {

  plants = signal<PlantInformationModel[]>([]);
  showPlantModal: boolean = false;
  viewMode: boolean = false;
  editingPlant: PlantInformationModel | null = null;
  newPlant: PlantInformationModel = this.getEmptyPlant();

  userRole = signal<string>('user');

  pageSizeOptions: number[] = [10, 20, 50, 100];
  pageSize = signal<number>(10);
  currentPage = signal<number>(1);

  tableRowConfig = computed(() => {
    const end = this.currentPage() * this.pageSize();
    const start = end - this.pageSize();
    return this.plants().slice(start, end);
  });

  totalRows = computed(() => this.plants().length);
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalRows() / Math.max(1, this.pageSize()))));

  pageRangeText = computed(() => {
    const total = this.totalRows();
    if (total === 0) return '0–0 of 0';
    const size = Math.max(1, this.pageSize());
    const page = Math.min(Math.max(1, this.currentPage()), this.totalPages());
    const start = (page - 1) * size + 1;
    const end = Math.min(total, page * size);
    return `${start}–${end} of ${total}`;
  });

  private store = inject(Store);
  private dialog = inject(MatDialog);
  private service = inject(HttpService);

  ngOnInit(): void {
    const role = localStorage.getItem('role');
    if (role) this.userRole.set(role);
    this.initializePlantData();
  }

  async initializePlantData(): Promise<void> {
    const result = await this.service.getMasterPlants(true);
    if (result && result.status === 'success' && result.data) {
      this.plants.set(result.data.sort((a,b) => a.id - b.id));
    } else {
      this.plants.set([]);
    }
  }

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
      cod: '',
      group: ''
    } as PlantInformationModel;
  }

  openAddPlantModal(): void {
    this.editingPlant = null;
    this.newPlant = this.getEmptyPlant();
    this.viewMode = false;
    this.showPlantModal = true;
  }

  openEditPlantModal(plant: PlantInformationModel): void {
    this.editingPlant = plant;
    this.newPlant = { ...plant };
    this.viewMode = false;
    this.showPlantModal = true;
  }

  openViewPlantModal(plant: PlantInformationModel): void {
    this.editingPlant = plant;
    this.newPlant = { ...plant };
    this.viewMode = true;
    this.showPlantModal = true;
  }

  async closePlantModal(): Promise<void> {
    this.showPlantModal = false;
    this.viewMode = false;
    this.editingPlant = null;
    this.newPlant = this.getEmptyPlant();
    await this.initializePlantData();
  }

  async togglePlantEnable(plant: PlantInformationModel): Promise<void> {
    const nextEnable = plant.enable !== 1;
    const response = await this.service.togglePlant({ id: plant.id, enable: nextEnable });
    if (response && response.status === 'success') {
      this.store.dispatch(sendMessage({ payload: { text: `Plant ${nextEnable ? 'enabled' : 'disabled'}`, type: 'success' } }));
    } else {
      this.store.dispatch(sendMessage({ payload: { text: response?.message || 'Failed to update status', type: 'error' } }));
    }
    await this.initializePlantData();
  }

  async deletePlant(id: number): Promise<void> {
    const response = await this.service.deletePlant({ id });
    if (response && response.status === 'success') {
      this.store.dispatch(sendMessage({ payload: { text: 'Plant deleted successfully', type: 'success' } }));
    } else {
      this.store.dispatch(sendMessage({ payload: { text: response?.message || 'Failed to delete plant', type: 'error' } }));
    }
    await this.initializePlantData();
  }

  confirmDeletePlant(plant: PlantInformationModel): void {
    const dialogData: ConfirmDialogData = {
      title: 'Delete Plant',
      message: `Are you sure you want to delete '${plant.siteid}'?`,
      subMessage: 'The plant will be disabled (soft delete).',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    };
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '480px',
      data: dialogData,
      panelClass: 'confirm-dialog-panel'
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === true) await this.deletePlant(plant.id);
    });
  }

  setPageSizeFromEvent(ev: Event): void {
    const value = Number((ev.target as HTMLSelectElement)?.value);
    const nextSize = Number.isFinite(value) && value > 0 ? value : 10;
    this.pageSize.set(nextSize);
    this.currentPage.set(1);
  }

  prevPage(): void {
    this.currentPage.update(p => Math.max(1, p - 1));
  }

  nextPage(): void {
    this.currentPage.update(p => Math.min(this.totalPages(), p + 1));
  }
}
