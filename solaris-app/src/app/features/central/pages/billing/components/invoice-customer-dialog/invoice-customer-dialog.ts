import { Component, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { BillingLogDataModel, BillingStateDataModel } from '../../../../models/billing.model';
import { HttpService } from '../../../../../../shared/services/http.service';
import { ConfirmDialog, ConfirmDialogData } from '../../../../../../shared/components/confirm-dialog/confirm-dialog';
import { sendMessage } from '../../../../../../store/actions/toaster.actions';
import { SiteModel } from '../../../../../../shared/models/config.model';
import { BillingDetailDialogData } from '../confirmation-internal-dialog/confirmation-internal-dialog';


@Component({
  selector: 'app-invoice-customer-dialog',
  standalone: false,
  templateUrl: './invoice-customer-dialog.html',
  styleUrl: './invoice-customer-dialog.scss',
})
export class InvoiceCustomerDialog implements OnInit {
 
  data: BillingStateDataModel;
 
  pdfUrl        = signal<SafeResourceUrl | null>(null);
  loadingPdf    = signal(false);
  loadingLog    = signal(false);
  loading       = signal(false);
  logs          = signal<BillingLogDataModel[]>([]);
  comment: string = '';
  transactionReferenceNo?: string;
  userRole      = signal<string>('user');
  siteList = signal<SiteModel[]>([]);
  userName = signal<string>('');
  file: File | null = null;
  send_date: string = '';
  sendDateObj: Date = new Date();

  onSendDateSelect(date: Date): void {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (date > today) {
      this.store.dispatch(sendMessage({ payload: { type: 'warn', text: 'Please select a date that is not in the future' } }));
      //this.send_date = '';
      return;
    }
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    this.send_date = `${yyyy}-${mm}-${dd}`;
    this.sendDateObj = date;
  }
  
 
  readonly stepDefs = [
    { key: 'confirmation', label: 'Confirmation' },
    { key: 'invoice',      label: 'Invoice'      },
    { key: 'payment',      label: 'Payment'      },
    { key: 'receipt',      label: 'Receipt'      },
  ];
 
  private readonly stepOrder = ['confirmation', 'invoice', 'payment', 'receipt'];
 
  private dialogRef  = inject(MatDialogRef<InvoiceCustomerDialog>);
  private dialogData = inject<BillingDetailDialogData>(MAT_DIALOG_DATA);
  private http       = inject(HttpService);
  private store      = inject(Store);
  private sanitizer  = inject(DomSanitizer);
  private dialogs    = inject(MatDialog);
 
  constructor() {
    this.data = this.dialogData.row;
    this.siteList.set(this.dialogData.siteList);
  }
 
  ngOnInit(): void {
    //this.loadPdf();
    const yyyy = this.sendDateObj.getFullYear();
    const mm = String(this.sendDateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(this.sendDateObj.getDate()).padStart(2, '0');
    this.send_date = `${yyyy}-${mm}-${dd}`;
    const us = localStorage.getItem('user');
    if(us) {
      this.userName.set(us);
    }
    const role = localStorage.getItem('role');
    if(role){
      this.userRole.set(role);
    }
    this.loadLog();
  }

  getSiteName(siteId: string): string {
    return this.siteList().find(x => x.id === siteId)?.name || '';
  }
 
  // ─── Stepper helpers ────────────────────────────────────────────────────────
 
  isStepDone(stepKey: string): boolean {
    const ci = this.stepOrder.indexOf((this.data.billing_process || '').toLowerCase());
    const si = this.stepOrder.indexOf(stepKey);
    return si < ci;
  }
 
  isStepActive(stepKey: string): boolean {
    return (this.data.billing_process || '').toLowerCase() === stepKey;
  }
 
  isStepPending(stepKey: string): boolean {
    const ci = this.stepOrder.indexOf((this.data.billing_process || '').toLowerCase());
    const si = this.stepOrder.indexOf(stepKey);
    return si > ci;
  }
 
  // ─── Data loading ────────────────────────────────────────────────────────────
 
  async loadPdf(): Promise<void> {
    try {
      this.loadingPdf.set(true);
      const blob: any = await this.http.getBillingDocumentFile(
        {
          timestamp: this.data.timestamp,
          pointsource: this.data.siteId,
          process: 'invoice',
          type: 'signed'
        }
      );
      if(blob instanceof Blob && blob.size > 0) {
        this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(blob)));
      } else {
        throw new Error('Failed to load PDF');
      }
    } catch (error: any) {
      this.store.dispatch(sendMessage({ payload: { type: 'error', text: error.message } }));
    } finally {
      this.loadingPdf.set(false);
    }
  }
 
  async loadLog(): Promise<void> {
    try {
      this.loadingLog.set(true);
      const res: any = await this.http.getBillingLogData(this.data.siteId, this.data.timestamp);
      if (res?.status === 'success' && res.data) {
        this.logs.set(res.data.filter((log: BillingLogDataModel) => log.processType === 'invoice'));
        await this.loadPdf();
      } else {
        this.logs.set([]);
      }
    } catch {
      this.logs.set([]);
    } finally {
      this.loadingLog.set(false);
    }
  }

  get today(): string {
    return new Date().toISOString().split('T')[0];
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.file = input.files[0];
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const f = event.dataTransfer?.files?.[0];
    if (f) this.file = f;
  }

  clearFile(): void {
    this.file = null;
  }
 
  // ─── Actions ─────────────────────────────────────────────────────────────────
 
  confirmAction(): void {
    const dialogData: ConfirmDialogData = {
      title:       'Approve Invoice',
      message:     'Are you sure you want to approve this invoice?',
      subMessage:  'This action cannot be undone.',
      confirmText: 'Approve',
      cancelText:  'Cancel',
      type:        'info',
    };

    const ref = this.dialogs.open(ConfirmDialog, {
      width: '480px',
      data: dialogData,
      panelClass: 'confirm-dialog-panel'
    });

    ref.afterClosed().subscribe(async result => {
      if (result === true) {
        await this.approve();
      }
    });
  }
 
  async approve(): Promise<void> {
    try {
      if(!this.send_date) {
        this.store.dispatch(sendMessage({ payload: { type: 'warn', text: 'Send Date is required' } }));
        return;
      }

      // if(!this.file) {
      //   this.store.dispatch(sendMessage({ payload: { type: 'warn', text: 'Receipt file is required' } }));
      //   return;
      // }

      this.loading.set(true);
      const result: any = await this.http.updateInvoiceCustomerReview({
        timestamp: this.data.timestamp,
        pointsource: this.data.siteId,
        status: 'customer_approved',
        sitename: this.getSiteName(this.data.siteId),
        username: this.userName() || '',
        sendDate: this.send_date
      });
      
      if (result && result.StatusCode.toLowerCase().includes('success')) {
        this.store.dispatch(sendMessage({ payload: { type: 'success', text: result.Message } }));
        this.dialogRef.close({ action: 'approve', billingId: this.data.id });
      } else {
        this.store.dispatch(sendMessage({ payload: { type: 'error', text: result?.Message || 'Approve failed' } }));
      }
    } catch (error: any) {
      this.store.dispatch(sendMessage({ payload: { type: 'error', text: error.message } }));
    } finally {
      this.loading.set(false);
    }
  }
 
  close(): void {
    this.dialogRef.close(null);
  }
}
 
