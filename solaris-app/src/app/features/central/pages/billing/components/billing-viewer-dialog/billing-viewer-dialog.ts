import { Component, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { SiteModel } from '../../../../../../shared/models/config.model';
import { BillingLogDataModel, BillingStateDataModel, BillingDocumentProcessType, BillingDocumentType } from '../../../../models/billing.model';
import { HttpService } from '../../../../../../shared/services/http.service';
import { sendMessage } from '../../../../../../store/actions/toaster.actions';

export interface BillingViewerDialogData {
  row: BillingStateDataModel;
  siteList: SiteModel[];
}

@Component({
  selector: 'app-billing-viewer-dialog',
  standalone: false,
  templateUrl: './billing-viewer-dialog.html',
  styleUrl: './billing-viewer-dialog.scss'
})
export class BillingViewerDialog implements OnInit {

  data: BillingStateDataModel;

  siteList = signal<SiteModel[]>([]);
  logs = signal<BillingLogDataModel[]>([]);

  loadingLog = signal(false);
  loadingPdf = signal(false);

  activeProcess = signal<BillingDocumentProcessType>('confirmation');
  activeType = signal<BillingDocumentType>('unsigned');
  pdfUrl = signal<SafeResourceUrl | null>(null);

  // Human-friendly labels for billing process statuses (aligned with SOLARIS_REPORT/services/billings-state.js)
  private readonly statusLabelMap: Record<BillingProcessKey, Record<string, string>> = {
    confirmation: {
      prepared: 'Prepared',
      user_sending: 'User sent',
      user_wait_for_approve: 'Waiting for user approval',
      user_approved: 'User approved',
      user_reject: 'User rejected',
      account_sending: 'Account sent',
      account_wait_for_approve: 'Waiting for account approval',
      account_approved: 'Account approved',
      account_reject: 'Account rejected',
      customer_sending: 'Customer sent',
      customer_wait_for_approve: 'Waiting for customer approval',
      customer_reject: 'Customer rejected',
      customer_approved: 'Customer approved',
      complete: 'Completed',
    },
    invoice: {
      prepared: 'Prepared',
      user_sending: 'User sent invoice',
      user_wait_for_approve: 'Waiting for user approval (invoice)',
      user_approved: 'User approved',
      user_reject: 'User rejected',
      account_sending: 'Account sent invoice',
      account_wait_for_approve: 'Waiting for account approval (invoice)',
      account_approved: 'Account approved',
      account_reject: 'Account rejected',
      customer_sending: 'Customer sent/responded to invoice',
      customer_wait_for_approve: 'Waiting for customer approval (invoice)',
      customer_reject: 'Customer rejected',
      customer_approved: 'Customer approved',
      complete: 'Completed',
    },
    payment: {
      prepared: 'Prepared',
      wait_for_payment: 'Waiting for payment',
      customer_paid: 'Customer paid',
      account_approved: 'Account confirmed payment',
      complete: 'Completed',
    },
    receipt: {
      prepared: 'Prepared',
      customer_sending: 'Customer sent receipt/documents',
      customer_wait_for_approve: 'Waiting for approval',
      customer_reject: 'Rejected',
      customer_approved: 'Approved',
      complete: 'Completed',
    },
  };

  humanizeBillingStatus(stepKey: BillingProcessKey, rawStatus: string): string {
    const s = (rawStatus || '').trim();
    if (!s) return '';
    const key = s.toLowerCase();
    const mapped = this.statusLabelMap[stepKey]?.[key];
    if (mapped) return mapped;

    // Fallback: user_wait_for_approve -> "User wait for approve"
    return key
      .split('_')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  private dialogRef = inject(MatDialogRef<BillingViewerDialog>);
  private dialogData = inject<BillingViewerDialogData>(MAT_DIALOG_DATA);
  private http = inject(HttpService);
  private store = inject(Store);
  private sanitizer = inject(DomSanitizer);

  constructor() {
    this.data = this.dialogData.row;
    this.siteList.set(this.dialogData.siteList);
  }

  ngOnInit(): void {
    this.loadLogs();
  }

  getSiteName(siteId: string): string {
    return this.siteList().find(x => x.id === siteId)?.name || '';
  }

  async loadLogs(): Promise<void> {
    try {
      this.loadingLog.set(true);
      const res: any = await this.http.getBillingLogData(this.data.siteId, this.data.timestamp);
      if (res?.status === 'success' && res.data) {
        this.logs.set(res.data);
      } else {
        this.logs.set([]);
      }
    } catch {
      this.logs.set([]);
    } finally {
      this.loadingLog.set(false);
    }
  }

  async viewDocument(process: any, type: BillingDocumentType): Promise<void> {
    try {
      this.loadingPdf.set(true);
      this.activeProcess.set(process);
      this.activeType.set(type);
      const blob: any = await this.http.getBillingDocumentFile({
        timestamp: this.data.timestamp,
        pointsource: this.data.siteId,
        process,
        type
      });
      const url = URL.createObjectURL(blob);
      //console.log('Document URL:', url, blob);
      if(blob?.size > 200) {
        this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
      } else {
        this.pdfUrl.set(null);
        this.store.dispatch(sendMessage({ payload: { type: 'error', text: 'Document not available' } }));
      }
      //this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    } catch (error: any) {
      this.pdfUrl.set(null);
      this.store.dispatch(sendMessage({ payload: { type: 'error', text: error?.message || 'Document not available' } }));
    } finally {
      this.loadingPdf.set(false);
    }
  }

  close(): void {
    this.dialogRef.close(null);
  }
}

type BillingStatusKey = 'prepared' | 'onprogress' | 'complete' | 'delay';
type BillingProcessKey = 'confirmation' | 'invoice' | 'payment' | 'receipt';
