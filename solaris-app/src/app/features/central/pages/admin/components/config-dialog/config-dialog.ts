import { Component, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { BillingConfigModel, CreateBillingRequestModel, UpdateBillingRequestModel } from '../../../../models/billing.model';
import { HttpService } from '../../../../../../shared/services/http.service';
import { Store } from '@ngrx/store';
import { SiteModel } from '../../../../../../shared/models/config.model';
import { firstValueFrom } from 'rxjs';
import { getAllConfig } from '../../../../../../store/selectors/site.selectors';
import { sendMessage } from '../../../../../../store/actions/toaster.actions';
import { UserDataModel } from '../../../../../../shared/models/user.model';

interface ContactCostEntry {
  year: number;
  cost: number;
  onpeak: number;
  offpeak: number;
}

@Component({
  selector: 'app-config-dialog',
  standalone: false,
  templateUrl: './config-dialog.html',
  styleUrl: './config-dialog.scss'
})
export class ConfigDialog implements OnInit {

  // Site config form\
  siteInput = input<BillingConfigModel>(this.getEmptySiteConfig());
  siteConfig = signal<BillingConfigModel>(this.getEmptySiteConfig());
  mode = input<'view' | 'edit' | 'add'>('view');
  onClose = output();
  onSave = output<BillingConfigModel>();
  siteList = signal<SiteModel[]>([]);
  userList = signal<UserDataModel[]>([]);
  contactCostEntries = signal<ContactCostEntry[]>([{ year: new Date().getFullYear(), cost: 0, onpeak: 0, offpeak: 0 }]);

  private httpSrv = inject(HttpService);
  private store = inject(Store);

  constructor(){
    effect(() => {
      if(this.siteInput() && this.siteInput()?.id && this.siteInput().id > 0){
        this.siteConfig.set(this.siteInput());
        const isTou = this.siteInput().meterType === 'tou';
        const isFloating = this.siteInput().contactType === 'FLOATING';
        this.contactCostEntries.set(this.parseContactCost(this.siteInput().contactCost, isTou, isFloating));
      }
    })
  }

  private parseContactCost(str: string | null | undefined, isTou: boolean, isFloating: boolean): ContactCostEntry[] {
    if (isFloating) {
      const monthMap = new Map<number, { cost: number; onpeak: number; offpeak: number }>();
      if (str && str.trim() !== '') {
        str.split(',').forEach(entry => {
          const parts = entry.trim().split(':');
          const month = +(parts[0] ?? 0);
          if (month >= 1 && month <= 12) {
            monthMap.set(month, isTou
              ? { cost: 0, onpeak: +(parts[1] ?? 0), offpeak: +(parts[2] ?? 0) }
              : { cost: +(parts[1] ?? 0), onpeak: 0, offpeak: 0 }
            );
          }
        });
      }
      return Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const existing = monthMap.get(month);
        return { year: month, cost: existing?.cost ?? 0, onpeak: existing?.onpeak ?? 0, offpeak: existing?.offpeak ?? 0 };
      });
    }
    if (!str || str.trim() === '') {
      return [{ year: new Date().getFullYear(), cost: 0, onpeak: 0, offpeak: 0 }];
    }
    const entries = str.split(',').map(entry => {
      const parts = entry.trim().split(':');
      if (isTou) {
        return { year: +(parts[0] ?? 0), cost: 0, onpeak: +(parts[1] ?? 0), offpeak: +(parts[2] ?? 0) };
      }
      return { year: +(parts[0] ?? 0), cost: +(parts[1] ?? 0), onpeak: 0, offpeak: 0 };
    }).filter(e => e.year > 0);
    return entries.length > 0 ? entries : [{ year: new Date().getFullYear(), cost: 0, onpeak: 0, offpeak: 0 }];
  }

  private serializeContactCost(entries: ContactCostEntry[], isTou: boolean, isFloating: boolean): string {
    return entries
      .filter(e => isFloating ? (e.year >= 1 && e.year <= 12) : e.year > 0)
      .map(e => {
        const key = isFloating ? String(e.year).padStart(2, '0') : String(e.year);
        return isTou ? `${key}:${e.onpeak}:${e.offpeak}` : `${key}:${e.cost}`;
      })
      .join(', ');
  }

  addContactCostEntry(): void {
    const lastYear = this.contactCostEntries().at(-1)?.year ?? new Date().getFullYear();
    this.contactCostEntries.update(entries => [
      ...entries,
      { year: lastYear + 1, cost: 0, onpeak: 0, offpeak: 0 }
    ]);
  }

  removeContactCostEntry(index: number): void {
    this.contactCostEntries.update(entries => entries.filter((_, i) => i !== index));
  }

  onContactTypeChange(): void {
    const isTou = this.siteConfig().meterType === 'tou';
    const isFloating = this.siteConfig().contactType === 'FLOATING';
    this.contactCostEntries.set(this.parseContactCost('', isTou, isFloating));
  }

  ngOnInit(): void {
    this.getSiteListData();
    this.initializeUserData();
  }

  async getSiteListData(){
    const res = await firstValueFrom(
      this.store.select(getAllConfig())
    );
    if(res && res[0]){
      //console.log(res)
      this.siteList.set(res[0].siteList);
    };
  }

  async initializeUserData() {
    const result = await this.httpSrv.getUserConfig();
    if (result) {
      this.userList.set(result);
    } else {
      this.userList.set([]);
    }
  }

  getEmptySiteConfig(): BillingConfigModel {
    const cost = `${new Date().getFullYear()}:0.00`;
    return {
      id: 0,
      siteId: '',
      meterType: 'normal',
      billingMode: 'manual',
      energyCost: 0,
      onpeakCost: 0,
      offpeakCost: 0,
      discountRate: 0,
      ftRate: 0,
      contactType: 'PPA',
      contactCost: cost,
      scheduleDate: '',
      scheduleTime: '',
      confirmation_user: [],
      confirmation_account: [],
      confirmation_customer: [],
      invoice_user: [],
      invoice_account: [],
      invoice_customer: [],
      receipt_user: [],
      receipt_account: [],
      receipt_customer: []
    };
  }

  closeModal(): void {
    this.onClose.emit();
  }

  onSiteConfigMeterModeChange(): void {
    if (this.siteConfig().meterType === 'normal') {
      this.siteConfig().onpeakCost = 0;
      this.siteConfig().offpeakCost = 0;
    } else {
      this.siteConfig().energyCost = 0;
    }
  }

  async saveSiteConfig() {
    if(!this.siteConfig().siteId || this.siteConfig().siteId === 'global'){
      return this.sendMessageToState('warn', 'Site id is un selectd or invalid');
    }

    const isTou = this.siteConfig().meterType === 'tou';
    const isFloating = this.siteConfig().contactType === 'FLOATING';
    const contactCost = this.serializeContactCost(this.contactCostEntries(), isTou, isFloating);

    if(this.siteConfig().id > 0){
      const request: UpdateBillingRequestModel = { ...this.siteConfig(), contactCost };
      const result = await this.httpSrv.updateBillingConfig(request);
      if(result && result.StatusCode && result.StatusCode.toLowerCase().includes('success')){
        this.sendMessageToState('success', 'Billing configuration updated successfully.');
      } else {
        this.sendMessageToState('error', 'Failed to update billing configuration.');
      }
    } else {
      const request: CreateBillingRequestModel = {
        siteId: this.siteConfig().siteId,
        meterType: this.siteConfig().meterType,
        billingMode: this.siteConfig().billingMode,
        energyCost: this.siteConfig().energyCost,
        onpeakCost: this.siteConfig().onpeakCost,
        offpeakCost: this.siteConfig().offpeakCost,
        discountRate: this.siteConfig().discountRate,
        ftRate: this.siteConfig().ftRate,
        scheduleDate: this.siteConfig().scheduleDate,
        scheduleTime: this.siteConfig().scheduleTime,
        confirmation_user: this.siteConfig().confirmation_user,
        confirmation_account: this.siteConfig().confirmation_account,
        confirmation_customer: this.siteConfig().confirmation_customer,
        invoice_user: this.siteConfig().invoice_user,
        invoice_account: this.siteConfig().invoice_account,
        invoice_customer: this.siteConfig().invoice_customer,
        receipt_user: this.siteConfig().receipt_user,
        receipt_account: this.siteConfig().receipt_account,
        receipt_customer: this.siteConfig().receipt_customer,
        contactType: this.siteConfig().contactType,
        contactCost
      };
      const result = await this.httpSrv.addBillingConfig(request);
      if(result && result.StatusCode && result.StatusCode.toLowerCase().includes('success')){
        this.sendMessageToState('success', 'Billing configuration created successfully.');
      } else {
        this.sendMessageToState('error', 'Failed to create billing configuration.');
      }
    }
  }

  sendMessageToState(type:  "error" | "success" | "info" | "warn" | "secondary" | "contrast", msg: string){
    this.store.dispatch(sendMessage({ 
      payload: { type: type, text: msg }
    }));
  }

  onChangeSiteId(event: any){
    //console.log(event?.target?.value)
    this.siteConfig.update(val => {
      return {
        ...val,
        siteId: event?.target?.value
      }
    })
  }

}
