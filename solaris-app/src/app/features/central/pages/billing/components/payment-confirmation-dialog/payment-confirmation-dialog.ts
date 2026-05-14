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
  selector: 'app-payment-confirmation-dialog',
  standalone: false,
  templateUrl: './payment-confirmation-dialog.html',
  styleUrl: './payment-confirmation-dialog.scss'
})
export class PaymentConfirmationDialog implements OnInit {
 
  data: BillingStateDataModel;
 
  pdfUrl        = signal<SafeResourceUrl | null>(null);
  loadingPdf    = signal(false);
  loadingLog    = signal(false);
  loading       = signal(false);
  logs          = signal<BillingLogDataModel[]>([]);
  comment: string = '';
  userRole      = signal<string>('user');
  siteList = signal<SiteModel[]>([]);
  userName = signal<string>('');

  paymentId?: string;
  paymentdate: string = '';
  paymentType: string = '';
  bank: string = '';

  
 
  readonly stepDefs = [
    { key: 'confirmation', label: 'Confirmation' },
    { key: 'invoice',      label: 'Invoice'      },
    { key: 'payment',      label: 'Payment'      },
    { key: 'receipt',      label: 'Receipt'      },
  ];
 
  private readonly stepOrder = ['confirmation', 'invoice', 'payment', 'receipt'];
 
  private dialogRef  = inject(MatDialogRef<PaymentConfirmationDialog>);
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
          process: 'payment',
          type: this.logs().filter(log => log.processType === this.data.billing_process).find(log => log.action.endsWith('_approve') && !log.action.includes('wait_for')) ? 'signed' : 'unsigned'
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
        this.logs.set(res.data.filter((log: BillingLogDataModel) => log.processType === 'payment'));
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
 
  // ─── Actions ─────────────────────────────────────────────────────────────────
 
  confirmAction(type: 'submit'): void {
    const isApprove = type === 'submit';
    const dialogData: ConfirmDialogData = {
      title:       'Submit Transaction No.',
      message:     'Are you sure you want to submit this transaction no.?',
      subMessage:  'This action cannot be undone.',
      confirmText: isApprove ? 'Submit' : 'Cancel',
      cancelText:  'Cancel',
      type:        isApprove ? 'info' : 'warning',
    };
 
    const ref = this.dialogs.open(ConfirmDialog, {
      width: '480px',
      data: dialogData,
      panelClass: 'confirm-dialog-panel'
    });
 
    ref.afterClosed().subscribe(async result => {
      if (result === true) {
        await this.approve()
      }
    });
  }
 
  async approve(): Promise<void> {
    try {
      //console.log(this.siteList());
      if(!this.paymentType) {
        this.store.dispatch(sendMessage({ payload: { type: 'warn', text: 'Payment type is required' } }));
        return;
      }
      if(!this.bank) {
        this.store.dispatch(sendMessage({ payload: { type: 'warn', text: 'Bank is required' } }));
        return;
      }
      if(!this.paymentId) {
        this.store.dispatch(sendMessage({ payload: { type: 'warn', text: 'Account / Cheque No. is required' } }));
        return;
      }
      if(!this.paymentdate) {
        this.store.dispatch(sendMessage({ payload: { type: 'warn', text: 'Payment date is required' } }));
        return;
      }

      this.loading.set(true);
      const result: any = await this.http.updatePaymentAccountingReview({
        timestamp: this.data.timestamp,
        pointsource: this.data.siteId,
        status: 'account_approved',
        sitename: this.getSiteName(this.data.siteId),
        username: this.userName() || '',
        paymentId: this.paymentId || '',
        bank: this.bank || '',
        paymentType: this.paymentType || '',
        paymentDate: this.paymentdate || '',
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
 