import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, inject, input, output, signal } from '@angular/core';
import { User } from '../../../../models/billing.model';
import { SiteModel, SiteStateModel } from '../../../../../../shared/models/config.model';
import { Store } from '@ngrx/store';
import { getZoneConfig } from '../../../../../../store/selectors/site.selectors';
import { ChnagePasswordRequestModel, UserDataModel } from '../../../../../../shared/models/user.model';
import { PageDataModel } from '../../../../../../shared/models/page.model';
import { HttpService } from '../../../../../../shared/services/http.service';
import { sendMessage } from '../../../../../../store/actions/toaster.actions';
import { PagesService } from '../../../../../../shared/services/pages.service';

@Component({
  selector: 'app-user-dialog',
  standalone: false,
  templateUrl: './user-dialog.html',
  styleUrl: './user-dialog.scss'
})
export class UserDialog implements OnInit, AfterViewInit {
  
  userList = input<UserDataModel[]>([]);
  userData = input<UserDataModel>(this.getEmptyUser());
  pageList = input<PageDataModel[]>([]);
  overviewPage: any[] = [];
  operationPage: any[] = [];
  financialPage: any[] = [];
  adminPage: any[] = [];
  newPassword: string = '';
  confirmPassword: string = '';
  signatureConsent: boolean = false;
  onClose = output();

  private nextUserId: number = 1;

  siteList = signal<SiteModel[]>([]);
  private store = inject(Store);
  private service = inject(HttpService);
  private pageSrv = inject(PagesService);

  @ViewChild('signatureCanvas') signatureCanvas?: ElementRef<HTMLCanvasElement>;
  private canvasContext: CanvasRenderingContext2D | null = null;
  private isDrawing: boolean = false;
  private deviceScale: number = 1;
  signaturePreview: string = '';
  private canvasCssWidth: number = 400;
  private canvasCssHeight: number = 200;
  constructor() {
  }

  ngOnInit(): void {
    this.overviewPage = this.pageSrv.getCentralPages();
    this.operationPage = this.pageSrv.getSitePages();
    this.financialPage = this.pageSrv.getFinancialPages();
    this.adminPage = this.pageSrv.getBillingPages();
    this.getSiteConfig();
    this.initializeMockData();
    this.getUserSignature();
  }

  initializeMockData(): void {
    
  }

  async getUserSignature(){
    const response = await this.service.getUserSignature(this.userData().username);
    if(response && typeof response === 'string') {
      this.signaturePreview = response;
      // If canvas is already initialized, render the saved signature into it.
      if (this.canvasContext) {
        this.drawSignatureImageToCanvas(response);
      }
    } else {
      this.signaturePreview = '';
    }
  }

  async getSiteConfig(){
    const config: SiteStateModel = await this.service.getConfig2('assets/sitelist.json');
    if(config){
      const zonselected = config.zoneList.flatMap(x => x.siteList);
      if(zonselected){
        this.siteList.set(zonselected);
      }
    }
  }

  // User Management Methods
  getEmptyUser(): UserDataModel {
    return {
      _id: '',
      username: '',
      password: '',
      Group: 'user',
      pageAccess: [],
      siteAccess: [],
      fullname: '',
      company: '',
      department: '',
      role: '',
      signature: ''
    };
  }

  closeUserModal(): void {
    this.onClose.emit();
  }

  // Signature handling
  ngAfterViewInit(): void {
    this.initializeSignatureCanvas();
  }

  private initializeSignatureCanvas(): void {
    if (!this.signatureCanvas) return;
    const canvas = this.signatureCanvas.nativeElement;
    const context = canvas.getContext('2d');
    if (!context) return;
    // Handle high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    this.deviceScale = dpr;
    const displayWidth = canvas.width;
    const displayHeight = canvas.height;
    this.canvasCssWidth = displayWidth;
    this.canvasCssHeight = displayHeight;
    canvas.width = Math.floor(displayWidth * dpr);
    canvas.height = Math.floor(displayHeight * dpr);
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    context.scale(dpr, dpr);
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.strokeStyle = '#000';
    this.canvasContext = context;

    // If we already loaded signaturePreview in ngOnInit, render it now.
    if (this.signaturePreview) {
      this.drawSignatureImageToCanvas(this.signaturePreview);
    }
  }

  onPointerDown(event: MouseEvent): void {
    if (!this.canvasContext || !this.signatureCanvas) return;
    this.isDrawing = true;
    const { x, y } = this.getCanvasPoint(event.clientX, event.clientY);
    this.canvasContext.beginPath();
    this.canvasContext.moveTo(x, y);
  }

  onPointerMove(event: MouseEvent): void {
    if (!this.isDrawing || !this.canvasContext) return;
    const { x, y } = this.getCanvasPoint(event.clientX, event.clientY);
    this.canvasContext.lineTo(x, y);
    this.canvasContext.stroke();
  }

  onPointerUp(): void {
    if (!this.canvasContext) return;
    this.isDrawing = false;
    this.canvasContext.closePath();
  }

  onTouchStart(event: TouchEvent): void {
    if (!this.canvasContext) return;
    const touch = event.touches[0];
    if (!touch) return;
    event.preventDefault();
    this.isDrawing = true;
    const { x, y } = this.getCanvasPoint(touch.clientX, touch.clientY);
    this.canvasContext.beginPath();
    this.canvasContext.moveTo(x, y);
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isDrawing || !this.canvasContext) return;
    const touch = event.touches[0];
    if (!touch) return;
    event.preventDefault();
    const { x, y } = this.getCanvasPoint(touch.clientX, touch.clientY);
    this.canvasContext.lineTo(x, y);
    this.canvasContext.stroke();
  }

  clearSignature(): void {
    if (!this.signatureCanvas || !this.canvasContext) return;
    const canvas = this.signatureCanvas.nativeElement;
    // Clear in CSS pixel space using scaled context
    this.canvasContext.save();
    this.canvasContext.setTransform(1, 0, 0, 1, 0, 0);
    this.canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    this.canvasContext.restore();
    // Re-apply base drawing settings
    this.canvasContext.lineWidth = 2;
    this.canvasContext.lineCap = 'round';
    this.canvasContext.strokeStyle = '#000';
    this.signaturePreview = '';
    this.signatureConsent = false;
  }

  private drawSignatureImageToCanvas(dataUrl: string): void {
    if (!this.signatureCanvas || !this.canvasContext) return;

    // Clear existing content without modifying `signaturePreview`.
    const canvas = this.signatureCanvas.nativeElement;
    this.canvasContext.save();
    this.canvasContext.setTransform(1, 0, 0, 1, 0, 0);
    this.canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    this.canvasContext.restore();
    this.canvasContext.lineWidth = 2;
    this.canvasContext.lineCap = 'round';
    this.canvasContext.strokeStyle = '#000';

    const img = new Image();
    img.onload = () => {
      // Draw using CSS pixel coordinates (context is scaled for DPR).
      this.canvasContext?.drawImage(img, 0, 0, this.canvasCssWidth, this.canvasCssHeight);
    };
    img.src = dataUrl;
  }

  saveCanvasSignature(): void {
    if (!this.signatureCanvas) return;
    const canvas = this.signatureCanvas.nativeElement;
    // Create an export canvas in CSS pixels to avoid DPR scaling in output
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = Math.floor(canvas.width / this.deviceScale);
    exportCanvas.height = Math.floor(canvas.height / this.deviceScale);
    const exportCtx = exportCanvas.getContext('2d');
    if (exportCtx) {
      exportCtx.fillStyle = '#ffffff';
      exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      exportCtx.drawImage(
        canvas,
        0, 0, canvas.width, canvas.height,
        0, 0, exportCanvas.width, exportCanvas.height
      );
      this.signaturePreview = exportCanvas.toDataURL('image/png');
    }
  }

  onSignatureFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.store.dispatch(sendMessage({ payload: { text: 'Please select an image file', type: 'warn' } }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.signaturePreview = result;
    };
    reader.readAsDataURL(file);
  }

  private getCanvasPoint(clientX: number, clientY: number): { x: number; y: number } {
    if (!this.signatureCanvas) return { x: 0, y: 0 };
    const rect = this.signatureCanvas.nativeElement.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return { x, y };
  }

  togglePageAccess(page: string): void {
    const index = this.userData().pageAccess.indexOf(page);
    if (index > -1) {
      this.userData().pageAccess.splice(index, 1);
    } else {
      this.userData().pageAccess.push(page);
    }
  }

  hasPageAccess(page: string): boolean {
    return this.userData().pageAccess.includes(page);
  }

  selectAllPages(): void {
    this.userData().pageAccess = this.pageList().flatMap(page => page.page.map(p => p.path));
  }

  deselectAllPages(): void {
    this.userData().pageAccess = [];
  }

  toggleSiteAccess(site: string): void {
    const index = this.userData().siteAccess.indexOf(site);
    if (index > -1) {
      this.userData().siteAccess.splice(index, 1);
    } else {
      this.userData().siteAccess.push(site);
    }
  }

  hasSiteAccess(site: string): boolean {
    return this.userData().siteAccess.includes(site);
  }

  selectAllSites(): void {
    this.userData().siteAccess = [...this.siteList().map(site => site.id)];
  }

  deselectAllSites(): void {
    this.userData().siteAccess = [];
  }

  async chnagePassword(oldPassword: string, newPassword: string) {
    if (!oldPassword.trim()) {
      this.store.dispatch(sendMessage({ payload: { text: 'Please enter old password', type: 'warn' } }));
      return;
    }
    if (!newPassword.trim()) {
      this.store.dispatch(sendMessage({ payload: { text: 'Please enter new password', type: 'warn' } }));
      return;
    }

    const body: ChnagePasswordRequestModel = {
      _id: this.userData()._id,
      oldpassword: oldPassword,
      newpassword: newPassword
    };
    const response = await this.service.updatePassword(body);
    if (response && response.success) {
      this.store.dispatch(sendMessage({ payload: { text: 'Password changed successfully', type: 'success' } }));
    } else {
      this.store.dispatch(sendMessage({ payload: { text: 'Failed to change password', type: 'error' } }));
    }
  };

  async saveUser() {
    if (!this.userData().username.trim()) {
      alert('Please enter username');
      return;
    }

    if (!this.userData().password.trim()) {
      alert('Please enter password');
      return;
    }

    this.closeUserModal();
  }

  async addUserSubmit() {
    if(!this.userData()._id) {
      if (!this.userData().password.trim()) {
        this.store.dispatch(sendMessage({ payload: { text: 'Please enter password', type: 'warn' } }));
        return;
      }
      if (!this.userData().username.trim()) {
        this.store.dispatch(sendMessage({ payload: { text: 'Please enter username', type: 'warn' } }));
        return;
      }
      if (!this.userData().Group.trim()) {
        this.store.dispatch(sendMessage({ payload: { text: 'Please select role', type: 'warn' } }));
        return;
      }
      if (this.userData().pageAccess.length === 0) {
        this.store.dispatch(sendMessage({ payload: { text: 'Please select page access', type: 'warn' } }));
        return;
      }
      if(this.userList().findIndex(u => u.username === this.userData().username) !== -1) {
        this.store.dispatch(sendMessage({ payload: { text: 'User already exists', type: 'warn' } }));
        return;
      }

      if (this.signaturePreview && !this.signatureConsent) {
        this.store.dispatch(sendMessage({ payload: { text: 'กรุณายินยอมให้เก็บลายเซ็นดิจิทัลก่อนบันทึก', type: 'warn' } }));
        return;
      }
      const body = {
        username: this.userData().username,
        password: this.userData().password,
        Group: this.userData().Group,
        pageAccess: this.userData().pageAccess,
        siteAccess: this.userData().siteAccess,
        firstName: this.userData().firstName,
        lastName: this.userData().lastName,
        fullname: this.userData().fullname,
        company: this.userData().company,
        email: this.userData().email,
        department: this.userData().department,
        role: this.userData().role,
        signature: this.signaturePreview || undefined
      };
      const response = await this.service.addUserConfig(body);
      if (response && response.success) {
        this.store.dispatch(sendMessage({ payload: { text: 'User added successfully', type: 'success' } }));
        this.closeUserModal();
      } else {
        this.store.dispatch(sendMessage({ payload: { text: 'Failed to add user', type: 'error' } }));
      }
    }
  }

  async editUserSubmit() {
    if(this.userData()._id) {
      if (!this.userData().username.trim()) {
        this.store.dispatch(sendMessage({ payload: { text: 'Please enter username', type: 'error' } }));
        return;
      }
      
      // if(this.userList().findIndex(u => u.username === this.userData().username) !== -1) {
      //   this.store.dispatch(sendMessage({ payload: { text: 'User already exists', type: 'warn' } }));
      //   return;
      // }
      
      if (this.signaturePreview && !this.signatureConsent) {
        this.store.dispatch(sendMessage({ payload: { text: 'กรุณายินยอมให้เก็บลายเซ็นดิจิทัลก่อนบันทึก', type: 'warn' } }));
        return;
      }
      const body = {
        _id: this.userData()._id,
        username: this.userData().username,
        password: this.userData().password,
        Group: this.userData().Group,
        pageAccess: this.userData().pageAccess,
        siteAccess: this.userData().siteAccess,
        firstName: this.userData().firstName,
        lastName: this.userData().lastName,
        fullname: this.userData().fullname,
        company: this.userData().company,
        email: this.userData().email,
        department: this.userData().department,
        role: this.userData().role,
        signature: this.signaturePreview || undefined
      };
      const response = await this.service.updateUserConfig(body);
      if (response && response.success) {
        this.store.dispatch(sendMessage({ payload: { text: 'User updated successfully', type: 'success' } }));
        this.closeUserModal();
      } else {
        this.store.dispatch(sendMessage({ payload: { text: 'Failed to update user', type: 'error' } }));
      }
    }
  }



}