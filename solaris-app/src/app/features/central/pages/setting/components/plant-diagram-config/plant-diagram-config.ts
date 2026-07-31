import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { HttpService } from '../../../../../../shared/services/http.service';
import { sendMessage } from '../../../../../../store/actions/toaster.actions';
import { ConfirmDialog, ConfirmDialogData } from '../../../../../../shared/components/confirm-dialog/confirm-dialog';
import { PlantDiagramModel, PlantInformationModel } from '../../../../../../shared/models/masterdata.model';
import { SiteModel, SiteStateModel } from '../../../../../../shared/models/config.model';

@Component({
  selector: 'app-plant-diagram-config',
  standalone: false,
  templateUrl: './plant-diagram-config.html',
  styleUrl: './plant-diagram-config.scss'
})
export class PlantDiagramConfig implements OnInit {

  diagrams = signal<PlantDiagramModel[]>([]);
  plants = signal<PlantInformationModel[]>([]);
  siteList = signal<SiteModel[]>([]);
  showDiagramModal: boolean = false;
  viewMode: boolean = false;
  newDiagram: PlantDiagramModel = this.getEmptyDiagram();

  userRole = signal<string>('user');

  pageSizeOptions: number[] = [10, 20, 50, 100];
  pageSize = signal<number>(10);
  currentPage = signal<number>(1);

  tableRowConfig = computed(() => {
    const end = this.currentPage() * this.pageSize();
    const start = end - this.pageSize();
    return this.diagrams().slice(start, end);
  });

  totalRows = computed(() => this.diagrams().length);
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
    this.initializeDiagramData();
    this.loadPlants();
    this.getSiteConfig();
  }

  async getSiteConfig(): Promise<void> {
    this.siteList.set(await this.service.getMasterSiteList());
  }

  getSiteNameById(siteId: string | null | undefined): string {
    if (!siteId) return 'N/A';
    const site = this.siteList().find(s => s.id === siteId);
    return site ? site.name : siteId;
  }

  async initializeDiagramData(): Promise<void> {
    const result = await this.service.getDiagrams();
    if (result && result.status === 'success' && result.data) {
      this.diagrams.set(result.data);
    } else {
      this.diagrams.set([]);
    }
  }

  async loadPlants(): Promise<void> {
    const result = await this.service.getMasterPlants(false);
    if (result && result.status === 'success' && result.data) {
      this.plants.set(result.data);
    }
  }

  getEmptyDiagram(): PlantDiagramModel {
    return { id: 0, siteid: '', path: '', file_type: '' } as PlantDiagramModel;
  }

  fileName(d: PlantDiagramModel): string {
    return (d.path || '').split('/').pop() || `diagram-${d.id}`;
  }

  openUploadModal(): void {
    this.newDiagram = this.getEmptyDiagram();
    this.viewMode = false;
    this.showDiagramModal = true;
  }

  openReplaceModal(d: PlantDiagramModel): void {
    this.newDiagram = { ...d };
    this.viewMode = false;
    this.showDiagramModal = true;
  }

  openViewDiagramModal(d: PlantDiagramModel): void {
    this.newDiagram = { ...d };
    this.viewMode = true;
    this.showDiagramModal = true;
  }

  async closeDiagramModal(): Promise<void> {
    this.showDiagramModal = false;
    this.viewMode = false;
    this.newDiagram = this.getEmptyDiagram();
    await this.initializeDiagramData();
  }

  async downloadDiagram(d: PlantDiagramModel): Promise<void> {
    try {
      const blob = await this.service.downloadDiagram({ id: d.id });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.fileName(d);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      this.store.dispatch(sendMessage({ payload: { text: e?.message || 'Download failed', type: 'error' } }));
    }
  }

  async deleteDiagram(id: number): Promise<void> {
    const response = await this.service.deleteDiagram({ id });
    if (response && response.status === 'success') {
      this.store.dispatch(sendMessage({ payload: { text: 'Diagram deleted successfully', type: 'success' } }));
    } else {
      this.store.dispatch(sendMessage({ payload: { text: response?.message || 'Failed to delete diagram', type: 'error' } }));
    }
    await this.initializeDiagramData();
  }

  confirmDeleteDiagram(d: PlantDiagramModel): void {
    const dialogData: ConfirmDialogData = {
      title: 'Delete Diagram',
      message: `Delete diagram of '${d.siteid}'?`,
      subMessage: 'The file will be removed from the server.',
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
      if (result === true) await this.deleteDiagram(d.id);
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
