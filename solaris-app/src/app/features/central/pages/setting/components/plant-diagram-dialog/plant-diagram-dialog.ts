import { Component, inject, input, output, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { HttpService } from '../../../../../../shared/services/http.service';
import { sendMessage } from '../../../../../../store/actions/toaster.actions';
import { PlantDiagramModel, PlantInformationModel } from '../../../../../../shared/models/masterdata.model';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB — matches backend limit

@Component({
  selector: 'app-plant-diagram-dialog',
  standalone: false,
  templateUrl: './plant-diagram-dialog.html',
  styleUrl: './plant-diagram-dialog.scss'
})
export class PlantDiagramDialog {

  diagramData = input<PlantDiagramModel>(this.getEmptyDiagram());
  plants = input<PlantInformationModel[]>([]);
  readonly = input<boolean>(false);
  onClose = output();

  selectedFile: File | null = null;
  selectedFileName = signal<string>('');
  uploading = signal<boolean>(false);

  private store = inject(Store);
  private service = inject(HttpService);

  getEmptyDiagram(): PlantDiagramModel {
    return { id: 0, siteid: '', path: '', file_type: '' } as PlantDiagramModel;
  }

  currentFileName(): string {
    const p = this.diagramData().path || '';
    return p.split('/').pop() || (this.diagramData().id ? `diagram-${this.diagramData().id}` : '-');
  }

  closeModal(): void {
    this.onClose.emit();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (file.size > MAX_FILE_SIZE) {
      this.store.dispatch(sendMessage({ payload: { text: 'File too large. Max allowed size is 10 MB', type: 'warn' } }));
      input.value = '';
      return;
    }
    this.selectedFile = file;
    this.selectedFileName.set(file.name);
  }

  async submit(): Promise<void> {
    const d = this.diagramData();
    if (!d.id && (!d.siteid || !d.siteid.trim())) {
      this.store.dispatch(sendMessage({ payload: { text: 'Please select Site ID', type: 'warn' } }));
      return;
    }
    if (!this.selectedFile) {
      this.store.dispatch(sendMessage({ payload: { text: 'Please select a file', type: 'warn' } }));
      return;
    }

    this.uploading.set(true);
    const user = this.currentUser();
    let response;
    if (d.id) {
      response = await this.service.updateDiagram(d.id, this.selectedFile, user);
    } else {
      response = await this.service.createDiagram(d.siteid, this.selectedFile, user);
    }
    this.uploading.set(false);

    if (response && response.status === 'success') {
      this.store.dispatch(sendMessage({ payload: { text: d.id ? 'Diagram replaced successfully' : 'Diagram uploaded successfully', type: 'success' } }));
      this.closeModal();
    } else {
      this.store.dispatch(sendMessage({ payload: { text: response?.message || 'Upload failed', type: 'error' } }));
    }
  }

  private currentUser(): string | undefined {
    return localStorage.getItem('username') || undefined;
  }
}
