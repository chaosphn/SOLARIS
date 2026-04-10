import { Component, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { SiteModel } from '../../../../../../shared/models/config.model';
import { BillingStateDataModel } from '../../../../models/billing.model';
import { HttpService } from '../../../../../../shared/services/http.service';
import { sendMessage } from '../../../../../../store/actions/toaster.actions';

export interface BillingEditorDialogData {
  row: BillingStateDataModel;
  siteList: SiteModel[];
}

@Component({
  selector: 'app-billing-editor-dialog',
  standalone: false,
  templateUrl: './billing-editor-dialog.html',
  styleUrl: './billing-editor-dialog.scss'
})
export class BillingEditorDialog implements OnInit {

  data: BillingStateDataModel;
  siteList = signal<SiteModel[]>([]);

  saving = signal(false);
  model = signal<BillingStateDataModel | null>(null);

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

  getStatusOptions(process: BillingProcessKey): Array<{ value: string; label: string }> {
    return Object.entries(this.statusLabelMap[process]).map(([value, label]) => ({ value, label }));
  }

  isKnownStatus(process: BillingProcessKey, value: string | null | undefined): boolean {
    if (!value) return false;
    return Object.prototype.hasOwnProperty.call(this.statusLabelMap[process], value);
  }

  getStatusLabel(process: BillingProcessKey, value: string | null | undefined): string {
    if (!value) return '';
    return this.statusLabelMap[process][value] || value;
  }

  private dialogRef = inject(MatDialogRef<BillingEditorDialog>);
  private dialogData = inject<BillingEditorDialogData>(MAT_DIALOG_DATA);
  private http = inject(HttpService);
  private store = inject(Store);

  constructor() {
    this.data = this.dialogData.row;
    this.siteList.set(this.dialogData.siteList);
  }

  ngOnInit(): void {
    this.model.set(structuredClone(this.data));
  }

  getSiteName(siteId: string): string {
    return this.siteList().find(x => x.id === siteId)?.name || '';
  }

  private toast(type: 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast', text: string) {
    this.store.dispatch(sendMessage({ payload: { type, text } }));
  }

  close(): void {
    this.dialogRef.close(null);
  }

  reset(): void {
    this.model.set(structuredClone(this.data));
  }

  async save(): Promise<void> {
    const m = this.model();
    if (!m) return;

    try {
      this.saving.set(true);
      const username = localStorage.getItem('user') || undefined;
      const res: any = await this.http.updateBillingState({
        ...m,
        id: this.data.id,
        user: username,
      });

      if (res?.StatusCode?.toLowerCase?.().includes('success')) {
        this.toast('success', res?.Message || 'Updated successfully');
        this.dialogRef.close({ action: 'saved', data: m });
      } else {
        this.toast('error', res?.Message || 'Update failed');
      }
    } catch (e: any) {
      this.toast('error', e?.message || 'Update failed');
    } finally {
      this.saving.set(false);
    }
  }
}

type BillingStatusKey = 'prepared' | 'onprogress' | 'complete' | 'delay';
type BillingProcessKey = 'confirmation' | 'invoice' | 'payment' | 'receipt';