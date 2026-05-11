import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, inject, output, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { ChnagePasswordRequestModel, UserDataModel } from '../../../shared/models/user.model';
import { HttpService } from '../../../shared/services/http.service';
import { sendMessage } from '../../../store/actions/toaster.actions';

@Component({
  selector: 'app-profile-dialog',
  standalone: false,
  templateUrl: './profile-dialog.html',
  styleUrl: './profile-dialog.scss'
})
export class ProfileDialog implements OnInit, AfterViewInit {

  onClose = output();

  userData = signal<UserDataModel>({
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
    email: '',
    signature: ''
  });

  newPassword: string = '';
  oldPassword: string = '';
  signaturePreview: string = '';
  signatureConsent: boolean = false;

  private store = inject(Store);
  private service = inject(HttpService);

  @ViewChild('signatureCanvas') signatureCanvas?: ElementRef<HTMLCanvasElement>;
  private canvasContext: CanvasRenderingContext2D | null = null;
  private isDrawing: boolean = false;
  private deviceScale: number = 1;
  private canvasCssWidth: number = 400;
  private canvasCssHeight: number = 200;

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  async loadCurrentUser(): Promise<void> {
    const username = localStorage.getItem('user') || '';
    const users = await this.service.getUserConfig();
    if (users && Array.isArray(users)) {
      const found = users.find((u: UserDataModel) => u.username === username);
      if (found) {
        this.userData.set({ ...found });
        await this.loadSignature(found.username);
      }
    }
  }

  async loadSignature(username: string): Promise<void> {
    const response = await this.service.getUserSignature(username);
    if (response && typeof response === 'string') {
      this.signaturePreview = response;
      if (this.canvasContext) {
        this.drawSignatureImageToCanvas(response);
      }
    } else {
      this.signaturePreview = '';
    }
  }

  closeModal(): void {
    this.onClose.emit();
  }

  // ─── Signature canvas ───────────────────────────────────────────────────────

  ngAfterViewInit(): void {
    this.initializeSignatureCanvas();
  }

  private initializeSignatureCanvas(): void {
    if (!this.signatureCanvas) return;
    const canvas = this.signatureCanvas.nativeElement;
    const context = canvas.getContext('2d');
    if (!context) return;
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
    this.canvasContext.save();
    this.canvasContext.setTransform(1, 0, 0, 1, 0, 0);
    this.canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    this.canvasContext.restore();
    this.canvasContext.lineWidth = 2;
    this.canvasContext.lineCap = 'round';
    this.canvasContext.strokeStyle = '#000';
    this.signaturePreview = '';
    this.signatureConsent = false;
  }

  private drawSignatureImageToCanvas(dataUrl: string): void {
    if (!this.signatureCanvas || !this.canvasContext) return;
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
      this.canvasContext?.drawImage(img, 0, 0, this.canvasCssWidth, this.canvasCssHeight);
    };
    img.src = dataUrl;
  }

  saveCanvasSignature(): void {
    if (!this.signatureCanvas) return;
    const canvas = this.signatureCanvas.nativeElement;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = Math.floor(canvas.width / this.deviceScale);
    exportCanvas.height = Math.floor(canvas.height / this.deviceScale);
    const exportCtx = exportCanvas.getContext('2d');
    if (exportCtx) {
      exportCtx.fillStyle = '#ffffff';
      exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      exportCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, exportCanvas.width, exportCanvas.height);
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
      this.signaturePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  private getCanvasPoint(clientX: number, clientY: number): { x: number; y: number } {
    if (!this.signatureCanvas) return { x: 0, y: 0 };
    const rect = this.signatureCanvas.nativeElement.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  // ─── Password ────────────────────────────────────────────────────────────────

  async changePassword(): Promise<void> {
    if (!this.oldPassword.trim()) {
      this.store.dispatch(sendMessage({ payload: { text: 'Please enter old password', type: 'warn' } }));
      return;
    }
    if (!this.newPassword.trim()) {
      this.store.dispatch(sendMessage({ payload: { text: 'Please enter new password', type: 'warn' } }));
      return;
    }
    const body: ChnagePasswordRequestModel = {
      _id: this.userData()._id,
      oldpassword: this.oldPassword,
      newpassword: this.newPassword
    };
    const response = await this.service.updatePassword(body);
    if (response && response.success) {
      this.store.dispatch(sendMessage({ payload: { text: 'Password changed successfully', type: 'success' } }));
      this.oldPassword = '';
      this.newPassword = '';
    } else {
      this.store.dispatch(sendMessage({ payload: { text: 'Failed to change password', type: 'error' } }));
    }
  }

  // ─── Save profile ────────────────────────────────────────────────────────────

  async saveProfile(): Promise<void> {
    const u = this.userData();
    if (!u._id) return;
    if (this.signaturePreview && !this.signatureConsent) {
      this.store.dispatch(sendMessage({ payload: { text: 'กรุณายินยอมให้เก็บลายเซ็นดิจิทัลก่อนบันทึก', type: 'warn' } }));
      return;
    }

    const body = {
      _id: u._id,
      username: u.username,
      Group: u.Group,
      pageAccess: u.pageAccess,
      siteAccess: u.siteAccess,
      fullname: u.fullname,
      email: u.email,
      company: u.company,
      department: u.department,
      role: u.role,
      signature: this.signaturePreview || undefined
    };
    const response = await this.service.updateUserConfig(body);
    if (response && response.success) {
      this.store.dispatch(sendMessage({ payload: { text: 'Profile updated successfully', type: 'success' } }));
      this.closeModal();
    } else {
      this.store.dispatch(sendMessage({ payload: { text: 'Failed to update profile', type: 'error' } }));
    }
  }
}
