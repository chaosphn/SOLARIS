import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { NavbarStateModel } from '../../../../shared/models/navigate.model';
import { SiteModel } from '../../../../shared/models/config.model';
import { HttpService } from '../../../../shared/services/http.service';
import { Store } from '@ngrx/store';
import { Datetime } from '../../../../shared/services/datetime';
import { getNavState } from '../../../../store/selectors/nav.selectors';
import { getAllConfig, getZoneConfig } from '../../../../store/selectors/site.selectors';
import { ReportConfigModel } from '../../../sites/models/report.model';
import { sendMessage } from '../../../../store/actions/toaster.actions';
import { Router } from '@angular/router';
import { BillingSessionModel } from '../../../../shared/models/billing.model';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { BillingLogDataModel, BillingStateDataModel, BillingStateResponseModel, GenerateConfirmationBillingRequestModel } from '../../models/billing.model';
import { BillingDetailDialogData, ConfirmationInternalDialog } from './components/confirmation-internal-dialog/confirmation-internal-dialog';
import { ConfirmationCustomerDialog } from './components/confirmation-customer-dialog/confirmation-customer-dialog';
import { InvoiceAccountingDialog } from './components/invoice-accounting-dialog/invoice-accounting-dialog';
import { PaymentConfirmationDialog } from './components/payment-confirmation-dialog/payment-confirmation-dialog';
import { ReceiptConfirmationDialog } from './components/receipt-confirmation-dialog/receipt-confirmation-dialog';

@Component({
  selector: 'app-billing',
  standalone: false,
  templateUrl: './billing.html',
  styleUrl: './billing.scss'
})
export class Billing implements OnInit, OnDestroy {

  navState$: Observable<NavbarStateModel>;
  config = signal<ReportConfigModel[]>([]);
  mode = signal<'d' | 'w' | 'm' | 'y'>('m');

  siteList = signal<SiteModel[]>([]);
  siteSelected = signal<string>('');
  reportType = signal<string>('');
  billingState = signal<BillingStateDataModel[]>([]);
  billingLog = signal<BillingLogDataModel[]>([]);
  navSub?: Subscription;
  pdfurl = signal<string>('');
  date: Date = new Date();
  loading = signal<Boolean>(false);
  loading2 = signal<Boolean>(false);
  loading3 = signal<Boolean>(false);
  loading4 = signal<Boolean>(false);
  
  isDropdownOpen1 = false;
  isDropdownOpen2 = false;
  options: DropdownOption[] = [];
  selectedReport?: DropdownOption;
  selectedSite?: DropdownOption;

  // Billing summaries and table view models
  private readonly billingStatusKeys: ReadonlyArray<BillingStatusKey> = ['prepared', 'onprogress', 'complete', 'delay'];
  private readonly billingProcessKeys: ReadonlyArray<BillingProcessKey> = ['confirmation', 'invoice', 'payment', 'receipt'];
  readonly stepDefs: { key: string; label: string }[] = [
    { key: 'confirmation', label: 'Confirmation' },
    { key: 'invoice',      label: 'Invoice'      },
    { key: 'payment',      label: 'Payment'      },
    { key: 'receipt',      label: 'Reciept'      },
  ];
   
  private readonly stepOrder = ['confirmation', 'invoice', 'payment', 'receipt'];

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

  private humanizeBillingStatus(stepKey: BillingProcessKey, rawStatus: string): string {
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

  billingStatusSummary = computed(() => {
    const items = this.billingState();
    const total = items.length;
    const counts: Record<BillingStatusKey, number> = {
      prepared: 0,
      onprogress: 0,
      complete: 0,
      delay: 0
    };
    for (const item of items) {
      const key = (item.status || '').toLowerCase() as BillingStatusKey;
      if (this.billingStatusKeys.includes(key)) {
        counts[key] += 1;
      }
    }
    return { total, counts };
  });

  billingProcessSummary = computed(() => {
    const items = this.billingState();
    const counts: Record<BillingProcessKey, number> = {
      confirmation: 0,
      invoice: 0,
      payment: 0,
      receipt: 0
    };
    for (const item of items) {
      const key = (item.billing_process || '').toLowerCase() as BillingProcessKey;
      if (this.billingProcessKeys.includes(key)) {
        counts[key] += 1;
      }
    }
    const total = items.length;
    return { total, counts };
  });

  // ─── Table pagination ────────────────────────────────────────────────────────
  pageSizeOptions: number[] = [10, 20, 50, 100];
  pageSize = signal<number>(10);
  currentPage = signal<number>(1); // 1-based

  billingTableRows = computed(() => {
    const items = this.billingState();
    return items.map(row => {
      const process = (row.billing_process || '').toLowerCase() as BillingProcessKey;
      let processStatus = '';
      switch (process) {
        case 'confirmation':
          processStatus = row.confirmation_status || '';
          break;
        case 'invoice':
          processStatus = row.invoice_status || '';
          break;
        case 'payment':
          processStatus = row.payment_status || '';
          break;
        case 'receipt':
          processStatus = row.reciept_status || '';
          break;
        default:
          processStatus = '';
          break;
      }
      return {
        id: row.id,
        siteId: row.siteId,
        billingStatus: row.status,
        contractType: 'fixed rate',
        billingState: row.billing_process,
        billingProcess: processStatus,
        confirmationStatus: row.confirmation_status,
        invoiceStatus: row.invoice_status,
        paymentStatus: row.payment_status,
        receiptStatus: row.reciept_status
      } as BillingTableRow;
    });
  });

  totalRows = computed(() => this.billingTableRows().length);
  totalPages = computed(() => {
    const total = this.totalRows();
    const size = this.pageSize();
    return Math.max(1, Math.ceil(total / Math.max(1, size)));
  });

  pagedRows = computed(() => {
    const rows = this.billingTableRows();
    const size = Math.max(1, this.pageSize());
    const page = Math.min(Math.max(1, this.currentPage()), this.totalPages());
    const start = (page - 1) * size;
    return rows.slice(start, start + size);
  });

  pageRangeText = computed(() => {
    const total = this.totalRows();
    if (total === 0) return '0–0 of 0';
    const size = Math.max(1, this.pageSize());
    const page = Math.min(Math.max(1, this.currentPage()), this.totalPages());
    const start = (page - 1) * size + 1;
    const end = Math.min(total, page * size);
    return `${start}–${end} of ${total}`;
  });
  reportOptions = computed(() => {
    const res: DropdownOption[] = this.config().map(x => (
      {
        value: x.type,
        label: x.name,
        icon: 'calendar_today'
      }
    ))
    return res;
  });
  siteOptions = computed(() => {
    const res: DropdownOption[] = this.siteList().map(x => (
      {
        value: x.id,
        label: x.name,
        icon: 'factory'
      }
    ))
    return res;
  });

  sessionId = signal<string>('');
  sessionData = signal<BillingSessionModel | null>(null);
  userRole = signal<string>('user');

  private http = inject(HttpService);
  private store = inject(Store);
  private dateTimeSrv = inject(Datetime);
  private router = inject(Router);
  private readonly dialogs = inject(MatDialog);

  constructor(){
    this.navState$ = this.store.select(getNavState);
    this.navSub = this.navState$.subscribe(async (state) => {
      this.siteSelected.set(state.location);
      const res = await firstValueFrom(
        this.store.select(getAllConfig())
      );
      if(res && res[0]){
        const sites = [
          {id: 'all', name: 'All Sites', project: '', location: '', capacity: ''},
          ...res[0].siteList
        ];
        this.siteList.set(sites);
      };
    });
  }

  ngOnInit(): void {
    this.getConfig();
    const role = localStorage.getItem('role');
    if(role){
      this.userRole.set(role);
    }
    const urlParts = this.router.url.split('/');
    const sessionId = urlParts[urlParts.length - 1];
    this.sessionId.set(sessionId);
    if(sessionId !== 'viewer'){
      const sessiondata: any = this.safeBase64Decode(sessionId);
      const sessionObj = JSON.parse(sessiondata);
      if(sessiondata && sessionObj && sessionObj.pointsource && sessionObj.timestamp){
        this.sessionData.set(sessionObj);
        this.siteSelected.set(sessionObj.pointsource);
        this.date = new Date(sessionObj.timestamp);
        this.getBillingStateData();
      }

    }
  }

  ngOnDestroy(): void {
    
  }

  async getBillingStateData(){
    try {
      this.loading.set(true);
      const dt = this.date;
      dt.setHours(0, 0, 0, 0);
      dt.setDate(1);
      const ts = new Date(dt).toISOString();
      const data: BillingStateResponseModel = await this.http.getBillingStateData(ts);
      if(data && data.status === 'success' && data.data){
        this.billingState.set(data.data);
        this.currentPage.set(1);
      } else {
        this.billingState.set([]);
        this.currentPage.set(1);
        this.store.dispatch(sendMessage({ 
          payload: { type: 'error', text: 'Failed to get billing state data' }
        }));
      }
      console.log(this.billingState())
    } catch (error: any) {
      this.billingState.set([]);
      this.currentPage.set(1);
      this.store.dispatch(sendMessage({ 
        payload: { type: 'error', text: error.message || 'Failed to get billing state data' }
      }));
    } finally {
      this.loading.set(false);
    }
  }

  async getConfig(){
    try {
      const config = await this.http.getConfig2(`assets/central/reports/configurations/reports.config.json`);
      if(config){
        this.config.set(config);
      } else {
        this.config.set([]);
      }
    } catch (error) {
    }
  }

  toggleDropdown1(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen1 = !this.isDropdownOpen1;
  }

  selectOption1(event: Event, option: DropdownOption): void {
    event.stopPropagation();
    this.selectedReport = option;
    this.isDropdownOpen1 = false;
    switch (option.value) {
      case "daily":
        this.mode.set('d');
        break;
      case "monthly":
        this.mode.set('m');
        break;
      case "yearly":
        this.mode.set('y');
        break;
      default:
        break;
    }
  }

  toggleDropdown2(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen2 = !this.isDropdownOpen2;
  }

  selectOption2(event: Event, option: DropdownOption): void {
    event.stopPropagation();
    this.selectedSite = option;
    this.isDropdownOpen2 = false;
    
  }

  onDateSelect(event: any) {
    this.date = event;
  }

  async generateReport() {
    try {
      this.loading4.set(true);
      if(this.selectedSite?.value){
        await new Promise(resolve => setTimeout(resolve, 200));
        const dt = this.date;
        dt.setHours(0, 0, 0, 0);
        dt.setDate(1);
        const ts = new Date(dt).toISOString();
        const body: GenerateConfirmationBillingRequestModel = {
          sitename: this.getSiteName(this.selectedSite.value),
          pointsource: this.selectedSite.value,
          timestamp: ts
        };
        const result: any = await this.http.generateConfirmationBilling(body);
        if(result && result.StatusCode.toLowerCase().includes('success')){
          this.store.dispatch(sendMessage({ 
            payload: { type: 'success', text: result?.Message || 'Billing generated successfully' }
          }));
          this.getBillingStateData();
        } else {          this.store.dispatch(sendMessage({ 
            payload: { type: 'error', text: result?.Message || 'Failed to generate billing' }
          }));
        }
      } else {
        this.store.dispatch(sendMessage({ 
          payload: { type: 'error', text: 'Please select site !' }
        }));
      };
      this.loading4.set(false);
    } catch (error: any) {
      this.store.dispatch(sendMessage({ 
        payload: { type: 'error', text: error.message }
      }));
      this.loading4.set(false);
    }
  }

  async selectReport() {
    try {
      this.loading.set(true);
      this.pdfurl.update(prev => '');
      if(this.selectedSite?.value){
        await new Promise(resolve => setTimeout(resolve, 200));
        const blob: any = await this.http.getBilling(this.selectedSite?.value, this.date.toISOString(), this.selectedReport?.value);
        if (blob && blob.data) {
          const byteArray = new Uint8Array(blob.data.data);
          const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });
          this.pdfurl.set(URL.createObjectURL(pdfBlob));
        } else {
          this.store.dispatch(sendMessage({ 
            payload: { type: 'error', text: 'No billings returned' }
          }));
        }
      } else {
        this.store.dispatch(sendMessage({ 
          payload: { type: 'error', text: 'Please select site !' }
        }));
      };
      this.loading.set(false);
    } catch (error: any) {
      this.store.dispatch(sendMessage({ 
        payload: { type: 'error', text: error.message }
      }));
      this.loading.set(false);
    }
  }

  async downloadReport() {
    try {
      this.loading2.set(true);
      if(this.selectedSite?.value){
        await new Promise(resolve => setTimeout(resolve, 200));
        const blob: any = await this.http.downloadBilling(this.selectedSite?.value, this.date.toISOString(), this.selectedReport?.value);
      } else {
        this.store.dispatch(sendMessage({ 
          payload: { type: 'warn', text: 'Please select site !' }
        }));
      };
      this.loading2.set(false);
    } catch (error: any) {
      this.store.dispatch(sendMessage({ 
        payload: { type: 'error', text: error.message }
      }));
      this.loading2.set(false);
    }
  }

  confirmApproveBillingData(): void {
    const dialogData: ConfirmDialogData = {
      title: 'Approve Billing',
      message: 'Are you sure you want to sending this billing to recievers?',
      subMessage: 'This action cannot be undone.',
      confirmText: 'Approve',
      cancelText: 'Cancel',
      type: 'info'
    };

    const dialogRef = this.dialogs.open(ConfirmDialog, {
      width: '480px',
      data: dialogData,
      panelClass: 'confirm-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === true) {
        await this.approveBillingData();
      }
    });

  }

  async approveBillingData() {
    try {
      this.loading3.set(true);
      if(!this.siteSelected && !this.selectedSite?.value){
        this.store.dispatch(sendMessage({ 
          payload: { type: 'warn', text: 'Please select site !' }
        }));
      }

      if(!this.sessionData){
        this.store.dispatch(sendMessage({ 
          payload: { type: 'warn', text: 'No data for this bill !' }
        }));
      }
      const ts = this.date.toISOString();
      const sietId = this.selectedSite?.value || '';
      const result = await this.http.approveBilling(this.sessionId(), ts, sietId);
      if(result && result?.StatusCode === "Approve Billing Success"){
        this.store.dispatch(sendMessage({ 
          payload: { type: 'success', text: result?.Message }
        }));
        this.sessionId.set('');
      } else {
        this.store.dispatch(sendMessage({ 
          payload: { type: 'error', text: result?.Message || 'Billing approval failed !' }
        }));
      }
      this.loading3.set(false);
    } catch (error: any) {
      this.store.dispatch(sendMessage({ 
        payload: { type: 'error', text: error.message }
      }));
      this.loading3.set(false);
    }
  };

  checkIsNowMonth(){
    const now = new Date();
    const nM = now.getMonth();
    const nY = now.getFullYear();
    const sM = this.date.getMonth();
    const sY = this.date.getFullYear();
    if(nM === sM && nY === sY){
      return true;
    } else {
      return false;
    }
  }

  getSiteName(siteId: string): string {
    const site = this.siteList().find(x => x.id === siteId);
    return site?.name || '';
  }

  isStepDone(currentProcess: string, stepKey: string, item: BillingTableRow): boolean {
    if(stepKey === 'confirmation'){
      return item.confirmationStatus === 'complete';
    } else if(stepKey === 'invoice'){
      return item.invoiceStatus === 'complete';
    } else if(stepKey === 'payment'){
      return item.paymentStatus === 'complete';
    } else if(stepKey === 'receipt'){
      return item.receiptStatus === 'complete';
    }
    const ci = this.stepOrder.indexOf((currentProcess || '').toLowerCase());
    const si = this.stepOrder.indexOf(stepKey);
    return si < ci;
  }
   
  isStepActive(currentProcess: string, stepKey: string, item: BillingTableRow): boolean {
    if(stepKey === 'confirmation'){
      return item.confirmationStatus !== 'complete' && item.confirmationStatus !== '' && item.confirmationStatus !== null && item.confirmationStatus !== 'prepared';
    } else if(stepKey === 'invoice'){
      return item.invoiceStatus !== 'complete' && item.invoiceStatus !== '' && item.invoiceStatus !== null && item.invoiceStatus !== 'prepared';
    } else if(stepKey === 'payment'){
      return item.paymentStatus !== 'complete' && item.paymentStatus !== '' && item.paymentStatus !== null && item.paymentStatus !== 'prepared';
    } else if(stepKey === 'receipt'){
      return item.receiptStatus !== 'complete' && item.receiptStatus !== '' && item.receiptStatus !== null && item.receiptStatus !== 'prepared';
    }

    return (currentProcess || '').toLowerCase() === stepKey;
  }
   
  isStepPending(currentProcess: string, stepKey: string, item: BillingTableRow): boolean {
    if(stepKey === 'confirmation'){
      return item.confirmationStatus === 'prepared' || item.confirmationStatus === '';
    } else if(stepKey === 'invoice'){
      return item.invoiceStatus === 'prepared' || item.invoiceStatus === '';
    } else if(stepKey === 'payment'){
      return item.paymentStatus === 'prepared' || item.paymentStatus === '';
    } else if(stepKey === 'receipt'){
      return item.receiptStatus === 'prepared' || item.receiptStatus === '';
    }

    const ci = this.stepOrder.indexOf((currentProcess || '').toLowerCase());
    const si = this.stepOrder.indexOf(stepKey);
    return si > ci;
  }

  getLabel(stepKey: string, item: BillingTableRow): string {
    const sk = (stepKey || '').toLowerCase() as BillingProcessKey;
    if (sk === 'confirmation') return this.humanizeBillingStatus(sk, item.confirmationStatus);
    if (sk === 'invoice') return this.humanizeBillingStatus(sk, item.invoiceStatus);
    if (sk === 'payment') return this.humanizeBillingStatus(sk, item.paymentStatus);
    if (sk === 'receipt') return this.humanizeBillingStatus(sk, item.receiptStatus);
    return '';
  }

  setPageSizeFromEvent(ev: Event) {
    const value = Number((ev.target as HTMLSelectElement)?.value);
    const nextSize = Number.isFinite(value) && value > 0 ? value : 10;
    this.pageSize.set(nextSize);
    this.currentPage.set(1);
  }

  prevPage() {
    this.currentPage.update(p => Math.max(1, p - 1));
  }

  nextPage() {
    this.currentPage.update(p => Math.min(this.totalPages(), p + 1));
  }

  safeBase64Decode(base64: string): string {
    try {
      // ✅ step 1: decode URL encoding ก่อน
      base64 = decodeURIComponent(base64);

      // ✅ step 2: fix URL-safe base64 (เผื่อมี - _)
      base64 = base64.replace(/-/g, '+').replace(/_/g, '/');

      // ✅ step 3: fix padding
      while (base64.length % 4) {
        base64 += '=';
      }

      // ✅ step 4: decode base64
      return decodeURIComponent(
        escape(atob(base64))
      );

    } catch (e) {
      console.error("Invalid Base64:", base64);
      throw e;
    }
  }

  openConfirmationInternalDialog(row: BillingTableRow): void {
    const item = this.billingState().find(x => x.id === row.id);
    if(!item) return;
    const data: BillingDetailDialogData = {
      row: item,
      siteList: this.siteList(),
    };
    const ref = this.dialogs.open(ConfirmationInternalDialog, {
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      data: data,
      panelClass: 'billing-detail-panel',
      disableClose: false,
    });
  
    ref.afterClosed().subscribe(result => {
      if (result?.action) {
        // refresh table หลัง approve/reject
        this.getBillingStateData();
      }
    });
  }

  openConfirmationCustomerDialog(row: BillingTableRow): void {
    const item = this.billingState().find(x => x.id === row.id);
    if(!item) return;
    const data: BillingDetailDialogData = {
      row: item,
      siteList: this.siteList(),
    };
    const ref = this.dialogs.open(ConfirmationCustomerDialog, {
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      data: data,
      panelClass: 'billing-detail-panel',
      disableClose: false,
    });
  
    ref.afterClosed().subscribe(result => {
      if (result?.action) {
        // refresh table หลัง approve/reject
        this.getBillingStateData();
      }
    });
  }

  openInvoiceAccountingDialog(row: BillingTableRow): void {
    const item = this.billingState().find(x => x.id === row.id);
    if(!item) return;
    const data: BillingDetailDialogData = {
      row: item,
      siteList: this.siteList(),
    };
    const ref = this.dialogs.open(InvoiceAccountingDialog, {
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      data: data,
      panelClass: 'billing-detail-panel',
      disableClose: false,
    });
  
    ref.afterClosed().subscribe(result => {
      if (result?.action) {
        // refresh table หลัง approve/reject
        this.getBillingStateData();
      }
    });
  }

  openPaymentConfirmationDialog(row: BillingTableRow): void {
    const item = this.billingState().find(x => x.id === row.id);
    if(!item) return;
    const data: BillingDetailDialogData = {
      row: item,
      siteList: this.siteList(),
    };
    const ref = this.dialogs.open(PaymentConfirmationDialog, {
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      data: data,
      panelClass: 'billing-detail-panel',
      disableClose: false,
    });
  
    ref.afterClosed().subscribe(result => {
      if (result?.action) {
        // refresh table หลัง approve/reject
        this.getBillingStateData();
      }
    });
  }

  openReceiptConfirmationDialog(row: BillingTableRow): void {
    const item = this.billingState().find(x => x.id === row.id);
    if(!item) return;
    const data: BillingDetailDialogData = {
      row: item,
      siteList: this.siteList(),
    };
    const ref = this.dialogs.open(ReceiptConfirmationDialog, {
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      data: data,
      panelClass: 'billing-detail-panel',
      disableClose: false,
    });
  
    ref.afterClosed().subscribe(result => {
      if (result?.action) {
        // refresh table หลัง approve/reject
        this.getBillingStateData();
      }
    });
  }

}

interface DropdownOption {
  value: string;
  label: string;
  icon: string;
}

type BillingStatusKey = 'prepared' | 'onprogress' | 'complete' | 'delay';
type BillingProcessKey = 'confirmation' | 'invoice' | 'payment' | 'receipt';

interface BillingTableRow {
  id: number;
  siteId: string;
  billingStatus: string;
  contractType: 'fixed rate';
  billingState: string;
  billingProcess: string;
  confirmationStatus: string;
  invoiceStatus: string;
  paymentStatus: string;
  receiptStatus: string;
}