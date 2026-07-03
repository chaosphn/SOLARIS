import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { HttpService } from '../../../../../../shared/services/http.service';
import { sendMessage } from '../../../../../../store/actions/toaster.actions';
import { ConfirmDialog, ConfirmDialogData } from '../../../../../../shared/components/confirm-dialog/confirm-dialog';
import { PlantInformationModel, PlantSlaModel } from '../../../../../../shared/models/masterdata.model';
import { SiteModel, SiteStateModel } from '../../../../../../shared/models/config.model';

@Component({
  selector: 'app-plant-sla-config',
  standalone: false,
  templateUrl: './plant-sla-config.html',
  styleUrl: './plant-sla-config.scss'
})
export class PlantSlaConfig implements OnInit {

  slaList = signal<PlantSlaModel[]>([]);
  plants = signal<PlantInformationModel[]>([]);
  siteList = signal<SiteModel[]>([]);
  showSlaModal: boolean = false;
  viewMode: boolean = false;
  editingSla: PlantSlaModel | null = null;
  newSla: PlantSlaModel = this.getEmptySla();

  userRole = signal<string>('user');

  pageSizeOptions: number[] = [10, 20, 50, 100];
  pageSize = signal<number>(10);
  currentPage = signal<number>(1);

  tableRowConfig = computed(() => {
    const end = this.currentPage() * this.pageSize();
    const start = end - this.pageSize();
    return this.slaList().slice(start, end);
  });

  totalRows = computed(() => this.slaList().length);
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
    this.initializeSlaData();
    this.loadPlants();
    this.getSiteConfig();
  }

  async getSiteConfig(): Promise<void> {
    const config: SiteStateModel = await this.service.getConfig2('assets/sitelist.json');
    if (config) {
      const zonselected = config.zoneList.map(x => x.siteList).flat(1);
      if (zonselected) this.siteList.set(zonselected);
    }
  }

  getSiteNameById(siteId: string | null | undefined): string {
    if (!siteId) return 'N/A';
    const site = this.siteList().find(s => s.id === siteId);
    return site ? site.name : siteId;
  }

  async initializeSlaData(): Promise<void> {
    const result = await this.service.getAllSla();
    if (result && result.status === 'success' && result.data) {
      this.slaList.set(result.data);
    } else {
      this.slaList.set([]);
    }
  }

  async loadPlants(): Promise<void> {
    const result = await this.service.getMasterPlants(false);
    if (result && result.status === 'success' && result.data) {
      this.plants.set(result.data);
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

  getYear(timestamp?: string): string {
    if (!timestamp) return '';
    const y = new Date(timestamp).getFullYear();
    return Number.isFinite(y) ? String(y) : String(timestamp).slice(0, 4);
  }

  openAddSlaModal(): void {
    this.editingSla = null;
    this.newSla = this.getEmptySla();
    this.viewMode = false;
    this.showSlaModal = true;
  }

  openEditSlaModal(sla: PlantSlaModel): void {
    this.editingSla = sla;
    this.newSla = { ...sla };
    this.viewMode = false;
    this.showSlaModal = true;
  }

  openViewSlaModal(sla: PlantSlaModel): void {
    this.editingSla = sla;
    this.newSla = { ...sla };
    this.viewMode = true;
    this.showSlaModal = true;
  }

  copySla(sla: PlantSlaModel): void {
    const nextYear = (Number(this.getYear(sla.timestamp)) || new Date().getFullYear()) + 1;
    this.editingSla = null;
    this.viewMode = false;
    this.newSla = {
      ...sla,
      id: 0,
      timestamp: `${nextYear}-01-01 00:00:00`
    };
    this.showSlaModal = true;
  }

  async closeSlaModal(): Promise<void> {
    this.showSlaModal = false;
    this.viewMode = false;
    this.editingSla = null;
    this.newSla = this.getEmptySla();
    await this.initializeSlaData();
  }

  async deleteSla(id: number): Promise<void> {
    const response = await this.service.deleteSla({ id });
    if (response && response.status === 'success') {
      this.store.dispatch(sendMessage({ payload: { text: 'SLA deleted successfully', type: 'success' } }));
    } else {
      this.store.dispatch(sendMessage({ payload: { text: response?.message || 'Failed to delete SLA', type: 'error' } }));
    }
    await this.initializeSlaData();
  }

  confirmDeleteSla(sla: PlantSlaModel): void {
    const dialogData: ConfirmDialogData = {
      title: 'Delete SLA',
      message: `Delete SLA of '${sla.siteid}' (${this.getYear(sla.timestamp)})?`,
      subMessage: 'This action cannot be undone.',
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
      if (result === true) await this.deleteSla(sla.id);
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
