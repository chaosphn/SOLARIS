import { Component, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { HttpService } from '../../../../../../shared/services/http.service';
import { sendMessage } from '../../../../../../store/actions/toaster.actions';
import { ConfirmDialog, ConfirmDialogData } from '../../../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-receipt-confirmation-dialog',
  standalone: false,
  templateUrl: './receipt-confirmation-dialog.html',
  styleUrl: './receipt-confirmation-dialog.scss',
})
export class ReceiptConfirmationDialog implements OnInit {

  private dialogRef = inject(MatDialogRef<ReceiptConfirmationDialog>);
  private dataInject = inject<any>(MAT_DIALOG_DATA);
  private http = inject(HttpService);
  private sanitizer = inject(DomSanitizer);
  private store = inject(Store);
  private dialogs = inject(MatDialog);

  data = this.dataInject.row;

  pdfUrl = signal<any>(null);
  loadingPdf = signal(false);
  loadingLog = signal(false);
  loading = signal(false);
  logs = signal<any[]>([]);

  userName = signal<string>('');

  // 🔥 PROCESS
  processes = ['confirmation', 'invoice', 'payment', 'receipt'];
  selectedProcess = 'confirmation';

  stepDefs = [
    { key: 'confirmation', label: 'Confirmation' },
    { key: 'invoice', label: 'Invoice' },
    { key: 'payment', label: 'Payment' },
    { key: 'receipt', label: 'Receipt' }
  ];

  stepOrder = ['confirmation', 'invoice', 'payment', 'receipt'];

  ngOnInit(): void {
    const user = localStorage.getItem('user');
    if (user) this.userName.set(user);

    this.loadLog();
    this.loadPdfByProcess(this.selectedProcess);
  }

  getSiteName(siteId: string): string {
    return this.dataInject.siteList?.find((x: any) => x.id === siteId)?.name || '';
  }

  /* ================= PDF ================= */

  async loadPdfByProcess(process: string) {
    try {
      this.loadingPdf.set(true);

      const blob: any = await this.http.getBillingDocumentFile({
        timestamp: this.data.timestamp,
        pointsource: this.data.siteId,
        process: process,
        type: 'signed'
      });

      if (blob instanceof Blob && blob.size > 0) {
        this.pdfUrl.set(
          this.sanitizer.bypassSecurityTrustResourceUrl(
            URL.createObjectURL(blob)
          )
        );
      }

    } catch {
      this.store.dispatch(sendMessage({
        payload: { type: 'error', text: 'Load PDF failed' }
      }));
    } finally {
      this.loadingPdf.set(false);
    }
  }

  selectProcess(p: string) {
    this.selectedProcess = p;
    this.loadPdfByProcess(p);
  }

  /* ================= LOG ================= */

  async loadLog() {
    try {
      this.loadingLog.set(true);

      const res: any = await this.http.getBillingLogData(
        this.data.siteId,
        this.data.timestamp
      );

      //this.logs.set(res?.data || []);
    } finally {
      this.loadingLog.set(false);
    }
  }

  /* ================= STEPPER ================= */

  isStepDone(step: string): boolean {
    const ci = this.stepOrder.indexOf(this.data.billing_process);
    const si = this.stepOrder.indexOf(step);
    return si < ci;
  }

  isStepActive(step: string): boolean {
    return this.data.billing_process === step;
  }

  /* ================= FINAL CONFIRM ================= */

  confirmAction(): void {
    const isApprove = true;
    const dialogData: ConfirmDialogData = {
      title:       'Confirmation Required',
      message:     'Are you sure you want to approve this receipt?',
      subMessage:  'This action cannot be undone.',
      confirmText: isApprove ? 'Approve' : 'Cancel',
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
        await this.confirmFinal();
      }
    });
  }

  async confirmFinal() {
    try {
      this.loading.set(true);

      const res: any = await this.http.updateReceiptCustomerReview({
        timestamp: this.data.timestamp,
        pointsource: this.data.siteId,
        sitename: this.getSiteName(this.data.siteId),
        username: this.userName()
      });

      if (res?.StatusCode?.toLowerCase().includes('success')) {
        this.store.dispatch(sendMessage({
          payload: { type: 'success', text: res.Message }
        }));

        this.dialogRef.close({ action: 'completed' });
      } else {
        throw new Error(res?.Message || 'Failed');
      }

    } catch (err: any) {
      this.store.dispatch(sendMessage({
        payload: { type: 'error', text: err.message }
      }));
    } finally {
      this.loading.set(false);
    }
  }

  close() {
    this.dialogRef.close();
  }
}