import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SiteModel } from '../../../../shared/models/config.model';
import { PlantSlaModel } from '../../../../shared/models/masterdata.model';
import { HttpService } from '../../../../shared/services/http.service';
import { BillingConfigModel, BillingStateDataModel, BillingLogDataModel, BillingDocumentProcessType, BillingDocumentType } from '../../models/billing.model';
import { buildDeliveryReport, deriveBillStatus, BillStatus, BILL_STATUS_LABEL } from '../../models/energy-delivery-report.model';
import { PpaDataLoader } from '../../services/ppa-data-loader';
import { selectPpaSiteList, selectPpaBillingConfigs, selectPpaSlaData } from '../../store/selectors/ppa.selector';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type BillingProcessKey = 'confirmation' | 'invoice' | 'payment' | 'receipt';

@Component({
  selector: 'app-energy-delivery-report',
  standalone: false,
  templateUrl: './energy-delivery-report.html',
  styleUrl: './energy-delivery-report.scss',
})
export class EnergyDeliveryReport implements OnInit {

  private store = inject(Store);
  private http = inject(HttpService);
  private ppaLoader = inject(PpaDataLoader);
  private sanitizer = inject(DomSanitizer);

  siteList = toSignal(this.store.select(selectPpaSiteList), { initialValue: [] as SiteModel[] });
  billingConfigs = toSignal(this.store.select(selectPpaBillingConfigs), { initialValue: [] as BillingConfigModel[] });
  slaData = toSignal(this.store.select(selectPpaSlaData), { initialValue: {} as Record<string, PlantSlaModel> });

  now = new Date();
  month = signal<Date>(new Date(this.now.setMonth(this.now.getMonth() - 1)));
  billingState = signal<BillingStateDataModel[]>([]);
  loading = signal<boolean>(true);

  analytics = computed(() => buildDeliveryReport(
    this.siteList(), this.slaData(), this.billingConfigs(), this.billingState(), this.month()
  ));

  monthLabel = computed(() => `${MONTHS[this.month().getMonth()]} ${this.month().getFullYear()}`);

  // inline bill viewer
  selectedBill = signal<BillingStateDataModel | null>(null);
  logs = signal<BillingLogDataModel[]>([]);
  loadingLog = signal(false);
  loadingPdf = signal(false);
  activeProcess = signal<BillingDocumentProcessType | null>(null);
  activeType = signal<BillingDocumentType>('unsigned');
  pdfUrl = signal<SafeResourceUrl | null>(null);
  rawPdfUrl = signal<string | null>(null);

  private readonly statusLabelMap: Record<BillingProcessKey, Record<string, string>> = {
    confirmation: { prepared: 'Prepared', user_sending: 'User sent', user_wait_for_approve: 'Waiting user approval', user_approved: 'User approved', user_reject: 'User rejected', account_sending: 'Account sent', account_wait_for_approve: 'Waiting account approval', account_approved: 'Account approved', account_reject: 'Account rejected', customer_sending: 'Customer sent', customer_wait_for_approve: 'Waiting customer approval', customer_reject: 'Customer rejected', customer_approved: 'Customer approved', complete: 'Completed' },
    invoice: { prepared: 'Prepared', user_sending: 'User sent invoice', user_wait_for_approve: 'Waiting user approval', user_approved: 'User approved', user_reject: 'User rejected', account_sending: 'Account sent invoice', account_wait_for_approve: 'Waiting account approval', account_approved: 'Account approved', account_reject: 'Account rejected', customer_sending: 'Customer responded', customer_wait_for_approve: 'Waiting customer approval', customer_reject: 'Customer rejected', customer_approved: 'Customer approved', complete: 'Completed' },
    payment: { prepared: 'Prepared', wait_for_payment: 'Waiting for payment', customer_paid: 'Customer paid', account_approved: 'Payment confirmed', complete: 'Completed' },
    receipt: { prepared: 'Prepared', customer_sending: 'Customer sent receipt', customer_wait_for_approve: 'Waiting approval', customer_reject: 'Rejected', customer_approved: 'Approved', complete: 'Completed' },
  };

  async ngOnInit(): Promise<void> {
    await this.ppaLoader.ensureLoaded();
    await this.loadBills();
  }

  async loadBills(): Promise<void> {
    this.loading.set(true);
    try {
      const dt = new Date(this.month());
      dt.setHours(0, 0, 0, 0);
      dt.setDate(1);
      const ts = dt.toISOString();
      const res = await this.http.getBillingStateData(ts);
      const ids = new Set(this.siteList().map(s => s.id));
      if (res && res.status === 'success' && res.data) {
        this.billingState.set(res.data.filter(x => ids.has(x.siteId)));
      } else {
        this.billingState.set([]);
      }
    } catch {
      this.billingState.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  onMonthSelect(d: Date): void {
    this.month.set(new Date(d));
    this.selectedBill.set(null);
    this.pdfUrl.set(null);
    this.rawPdfUrl.set(null);
    this.loadBills();
  }

  print(): void { window.print(); }

  // ───────── inline bill viewer ─────────
  openBill(siteId: string): void {
    const bill = this.billingState().find(b => b.siteId === siteId);
    if (!bill) { return; }
    this.selectedBill.set(bill);
    this.pdfUrl.set(null);
    this.rawPdfUrl.set(null);
    this.activeProcess.set(null);
    this.loadLogs(bill);
  }

  closeBill(): void {
    this.selectedBill.set(null);
    this.pdfUrl.set(null);
    this.rawPdfUrl.set(null);
  }

  siteName(siteId: string): string {
    return this.siteList().find(s => s.id === siteId)?.name || siteId;
  }

  overallStatus(): BillStatus {
    return deriveBillStatus(this.selectedBill() ?? undefined);
  }

  billLabel(s: BillStatus): string { return BILL_STATUS_LABEL[s]; }

  // workflow stepper 4 stage
  stages = computed(() => {
    const b = this.selectedBill();
    if (!b) { return []; }
    const defs: { key: BillingProcessKey; label: string; status: string | undefined }[] = [
      { key: 'confirmation', label: 'Confirmation', status: b.confirmation_status },
      { key: 'invoice', label: 'Invoice', status: b.invoice_status },
      { key: 'payment', label: 'Payment', status: b.payment_status },
      { key: 'receipt', label: 'Receipt', status: b.reciept_status },
    ];
    const order = defs.map(d => d.key);
    const allDone = (b.status || '').toLowerCase() === 'complete';
    const curIdx = order.indexOf((b.billing_process || '').toLowerCase() as BillingProcessKey);
    return defs.map((d, i) => {
      const raw = (d.status || '').toLowerCase();
      let state: 'done' | 'current' | 'pending' | 'rejected';
      if (allDone) { state = 'done'; }
      else if (raw.includes('reject')) { state = 'rejected'; }
      else if (curIdx < 0) { state = raw ? 'done' : 'pending'; }
      else if (i < curIdx) { state = 'done'; }
      else if (i === curIdx) { state = raw.includes('approved') || raw === 'complete' ? 'done' : 'current'; }
      else { state = 'pending'; }
      return { key: d.key, label: d.label, state, statusText: this.humanizeBillingStatus(d.key, d.status), index: i + 1 };
    });
  });

  progressPct = computed(() => {
    const st = this.stages();
    if (st.length === 0) { return 0; }
    const done = st.filter(s => s.state === 'done').length;
    return (done / (st.length - 1)) * 100;
  });

  logColor(action: string | undefined): string {
    const a = (action || '').toLowerCase();
    if (a.includes('reject')) { return '#E05D4E'; }
    if (a.includes('approve') || a.includes('paid') || a.includes('complete')) { return '#4CAF82'; }
    if (a.includes('send') || a.includes('sent')) { return '#4DA3FF'; }
    return '#667079';
  }

  stepBg(state: string): string {
    return state === 'done' ? '#4CAF82' : state === 'current' ? '#E4B61A' : state === 'rejected' ? '#E05D4E' : '#3B444D';
  }
  stepTextColor(state: string): string {
    return state === 'done' ? '#4CAF82' : state === 'current' ? '#E4B61A' : state === 'rejected' ? '#E05D4E' : '#667079';
  }

  humanizeBillingStatus(step: BillingProcessKey, raw: string | undefined): string {
    const s = (raw || '').trim();
    if (!s) { return '---'; }
    const key = s.toLowerCase();
    return this.statusLabelMap[step]?.[key] || key.split('_').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  private async loadLogs(bill: BillingStateDataModel): Promise<void> {
    try {
      this.loadingLog.set(true);
      const res: any = await this.http.getBillingLogData(bill.siteId, bill.timestamp);
      this.logs.set(res?.status === 'success' && res.data ? res.data : []);
    } catch {
      this.logs.set([]);
    } finally {
      this.loadingLog.set(false);
    }
  }

  async viewDocument(process: BillingDocumentProcessType, type: BillingDocumentType): Promise<void> {
    const bill = this.selectedBill();
    if (!bill) { return; }
    this.pdfUrl.set(null);
    this.rawPdfUrl.set(null);
    try {
      this.loadingPdf.set(true);
      this.activeProcess.set(process);
      this.activeType.set(type);
      const blob: any = await this.http.getBillingDocumentFile({ timestamp: bill.timestamp, pointsource: bill.siteId, process, type });
      if (blob?.size > 200) {
        const url = URL.createObjectURL(blob);
        this.rawPdfUrl.set(url);
        this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
      }
    } catch {
      this.pdfUrl.set(null);
    } finally {
      this.loadingPdf.set(false);
    }
  }

  downloadDocument(): void {
    const url = this.rawPdfUrl();
    if (!url) { return; }
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.activeProcess()}_${this.activeType()}_${this.selectedBill()?.siteId}.pdf`;
    a.click();
  }

  printDocument(): void {
    const url = this.rawPdfUrl();
    if (!url) { return; }
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;';
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => iframe.contentWindow?.print();
  }

  // ───────── helpers ─────────
  pct(v: number | null, d = 1): string { return v == null ? '---' : v.toFixed(d) + '%'; }

  mwh(kwh: number | null): string {
    if (kwh == null) { return '---'; }
    return (kwh / 1000).toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  baht(v: number | null): string {
    if (v == null) { return '---'; }
    return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  money(v: number | null): string {
    if (v == null) { return '---'; }
    const s = v < 0 ? '-' : '';
    const a = Math.abs(v);
    if (a >= 1e6) { return s + '฿' + (a / 1e6).toFixed(1) + 'M'; }
    if (a >= 1e3) { return s + '฿' + (a / 1e3).toFixed(0) + 'K'; }
    return s + '฿' + a.toFixed(0);
  }

  achvColor(a: number | null): string {
    if (a == null) { return 'var(--secondary-txt)'; }
    return a >= 100 ? '#4CAF82' : a >= 95 ? '#E4B61A' : '#E05D4E';
  }
}
