import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { NavbarStateModel } from '../../../../shared/models/navigate.model';
import { HttpService } from '../../../../shared/services/http.service';
import { Store } from '@ngrx/store';
import { getNavState } from '../../../../store/selectors/nav.selectors';
import { FindDiagramsBySiteRequest, PlantDiagramModel } from '../../../../shared/models/masterdata.model';
import { sendMessage } from '../../../../store/actions/toaster.actions';

const IMAGE_FILE_TYPES = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];

@Component({
  selector: 'app-topology',
  standalone: false,
  templateUrl: './topology.html',
  styleUrl: './topology.scss',
})
export class Topology implements OnInit, OnDestroy {

  navState$: Observable<NavbarStateModel>;
  siteSelected = signal<string>('');
  navSub?: Subscription;

  diagramList = signal<PlantDiagramModel[]>([]);
  selectedDiagram = signal<PlantDiagramModel>({} as PlantDiagramModel);

  loadingPreview = signal<boolean>(false);
  rawPreviewUrl = signal<string>('');
  isImage = signal<boolean>(false);
  isPdf = signal<boolean>(false);

  private http = inject(HttpService);
  private store = inject(Store);
  constructor(){
    this.navState$ = this.store.select(getNavState);
    this.navSub = this.navState$.subscribe(async (state) => {
      this.siteSelected.set(state.location);
      await this.getDiagramList();
    });
  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    if(this.navSub){
      this.navSub.unsubscribe();
    }
    this.revokePreviewUrl();
  }

  async getDiagramList(){
    const body: FindDiagramsBySiteRequest = {
      siteid: this.siteSelected()
    };
    const result = await this.http.findDiagramsBySite(body);
    if(result && result.data && result.data.length > 0){
      this.diagramList.set(result.data);
      this.selectedDiagram.set(result.data[0]);
      await this.loadPreview(result.data[0]);
    } else {
      this.diagramList.set([]);
      this.selectedDiagram.set({} as PlantDiagramModel);
      this.clearPreview();
    }
  }

  getFileName(str: string, type: string | undefined){
    const splitTxt = str.split('/');
    return type ? splitTxt[splitTxt.length - 1].replace('.'+type, '') : splitTxt[splitTxt.length - 1];
  }

  changeTabs(item: PlantDiagramModel ){
    this.selectedDiagram.set(item);
    this.loadPreview(item);
  }

  async loadPreview(item: PlantDiagramModel){
    if(!item || !item.id){
      this.clearPreview();
      return;
    }

    this.loadingPreview.set(true);
    this.revokePreviewUrl();

    try {
      const blob = await this.http.downloadDiagram({ id: item.id });
      if(blob && blob.size > 0){
        const type = (item.file_type || '').toLowerCase().replace('.', '');
        this.isImage.set(IMAGE_FILE_TYPES.includes(type));
        this.isPdf.set(type === 'pdf');
        this.rawPreviewUrl.set(window.URL.createObjectURL(blob));
      } else {
        this.store.dispatch(sendMessage({ payload: { type: 'error', text: 'Diagram file is not available' } }));
      }
    } catch (error) {
      this.store.dispatch(sendMessage({ payload: { type: 'error', text: 'Failed to load diagram' } }));
    } finally {
      this.loadingPreview.set(false);
    }
  }

  downloadDiagram(){
    const item = this.selectedDiagram();
    const url = this.rawPreviewUrl();
    if(!url || !item){
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = this.getFileName(item.path, undefined);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  private clearPreview(){
    this.revokePreviewUrl();
    this.isImage.set(false);
    this.isPdf.set(false);
  }

  private revokePreviewUrl(){
    const url = this.rawPreviewUrl();
    if(url){
      window.URL.revokeObjectURL(url);
      this.rawPreviewUrl.set('');
    }
  }
}
