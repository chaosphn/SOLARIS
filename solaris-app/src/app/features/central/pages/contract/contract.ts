import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { SiteModel } from '../../../../shared/models/config.model';
import { HttpService } from '../../../../shared/services/http.service';
import { Subscription, timer } from 'rxjs';
import { AppInitService } from '../../../../shared/services/app-init.service';
import { Datetime } from '../../../../shared/services/datetime';
import { DataRealtimeModel, ResponseHistorianModel } from '../../../../shared/models/response.model';
import { RequestAtTimeModel } from '../../../../shared/models/request.model';
import { PlantInformationModel, PlantSlaModel, FindSlaByDateRequest } from '../../../../shared/models/masterdata.model';
import { BillingConfigModel } from '../../models/billing.model';
import { ContractRowModel, ContractSummaryModel, parseContactCost } from '../../models/contract.model';

@Component({
  selector: 'app-contract',
  standalone: false,
  templateUrl: './contract.html',
  styleUrl: './contract.scss',
})
export class Contract implements OnInit, OnDestroy {

  siteList = signal<SiteModel[]>([]);
  billingConfigs = signal<BillingConfigModel[]>([]);
  slaData = signal<Record<string, PlantSlaModel>>({});
  dataRealtime = signal<DataRealtimeModel>({});
  selectedSiteId = signal<string>('');

  timers?: Subscription;
  date: Date = new Date();

  tableRows = computed<ContractRowModel[]>(() => {
    const sites = this.siteList();
    const configs = this.billingConfigs();
    const realtime = this.dataRealtime();
    return sites.map(site => {
      const config = configs.find(x => x.siteId === site.id) ?? null;
      const parsed = config ? parseContactCost(config.contactType, config.contactCost, this.date) : null;

      const energyRaw = realtime[`${site.id}_WH_MONTH`]?.Value;
      const energyMtd = typeof energyRaw === 'number' && !isNaN(energyRaw) ? energyRaw : null;
      const revenueMtd = parsed?.currentRate != null && energyMtd != null ? energyMtd * parsed.currentRate : null;

      return { site, config, parsed, energyMtd, revenueMtd };
    });
  });

  summary = computed<ContractSummaryModel>(() => {
    const rows = this.tableRows();
    const contracted = rows.filter(x => x.parsed);

    const totalCapacity = this.siteList().reduce((acc, site) => acc + (parseFloat(site.capacity) || 0), 0);

    const rates = contracted
      .map(x => x.parsed!.currentRate)
      .filter((x): x is number => x != null);
    const avgTariff = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : null;

    // เฉลี่ยเฉพาะสัญญาแบบ schedule (PPA) ที่มีวันสิ้นสุดจริง
    const ppaProgress = contracted
      .filter(x => x.parsed!.progressKind === 'contract' && x.parsed!.progress != null)
      .map(x => x.parsed!.progress!);
    const avgProgress = ppaProgress.length > 0 ? ppaProgress.reduce((a, b) => a + b, 0) / ppaProgress.length : null;

    const revenues = rows
      .map(x => x.revenueMtd)
      .filter((x): x is number => x != null);
    const totalRevenue = revenues.length > 0 ? revenues.reduce((a, b) => a + b, 0) : null;

    return {
      totalContract: contracted.length,
      ppaCount: contracted.filter(x => x.parsed!.isSchedule).length,
      floatingCount: contracted.filter(x => !x.parsed!.isSchedule).length,
      totalCapacity,
      avgTariff,
      avgProgress,
      totalRevenue
    };
  });

  // โดนัท coverage: สัดส่วน site ที่มีสัญญา (PPA / Floating / ไม่มี)
  donut = computed(() => {
    const rows = this.tableRows();
    const total = rows.length;
    const ppaCount = rows.filter(x => x.parsed?.isSchedule).length;
    const floatingCount = rows.filter(x => x.parsed && !x.parsed.isSchedule).length;
    const contracted = ppaCount + floatingCount;
    const noContractCount = total - contracted;

    const C = 2 * Math.PI * 42;
    const ppaLen = total > 0 ? (ppaCount / total) * C : 0;
    const floatLen = total > 0 ? (floatingCount / total) * C : 0;

    return {
      total,
      contracted,
      ppaCount,
      floatingCount,
      noContractCount,
      coveragePercent: total > 0 ? (contracted / total) * 100 : 0,
      ppaDash: `${ppaLen} ${C - ppaLen}`,
      floatDash: `${floatLen} ${C - floatLen}`,
      floatOffset: -ppaLen
    };
  });

  // รายได้เดือนนี้แยกตามประเภทสัญญา + tariff เฉลี่ยต่อประเภท
  revenueSplit = computed(() => {
    const rows = this.tableRows();
    const sumRevenue = (schedule: boolean) => rows
      .filter(x => x.parsed && x.parsed.isSchedule === schedule && x.revenueMtd != null)
      .reduce((acc, x) => acc + x.revenueMtd!, 0);
    const avgRate = (schedule: boolean) => {
      const rates = rows
        .filter(x => x.parsed && x.parsed.isSchedule === schedule && x.parsed.currentRate != null)
        .map(x => x.parsed!.currentRate!);
      return rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : null;
    };

    const ppaRevenue = sumRevenue(true);
    const floatingRevenue = sumRevenue(false);
    const total = ppaRevenue + floatingRevenue;

    return {
      ppaRevenue,
      floatingRevenue,
      total,
      ppaPercent: total > 0 ? (ppaRevenue / total) * 100 : 0,
      floatingPercent: total > 0 ? (floatingRevenue / total) * 100 : 0,
      avgPpaTariff: avgRate(true),
      avgFloatingTariff: avgRate(false)
    };
  });

  // สรุป warranty ปีปัจจุบัน: มูลค่ารับประกัน (energy_delivery × tariff), หน่วย warranty,
  // หน่วยที่ผลิตจริงปีนี้ (WH_YEAR) และ % delivered
  warrantyYear = computed(() => {
    const sla = this.slaData();
    const realtime = this.dataRealtime();
    const rows = this.tableRows().filter(x =>
      x.parsed &&
      x.parsed.currentRate != null &&
      sla[x.site.id]?.energy_delivery != null
    );

    let estTotal = 0;         // ฿ รับประกันปีนี้
    let warrantyEnergy = 0;   // kWh
    let producedEnergy = 0;   // kWh

    for (const x of rows) {
      const energyDelivery = sla[x.site.id].energy_delivery!;
      estTotal += energyDelivery * x.parsed!.currentRate!;
      warrantyEnergy += energyDelivery;
      const produced = realtime[`${x.site.id}_WH_YEAR`]?.Value;
      if (typeof produced === 'number' && !isNaN(produced)) {
        producedEnergy += produced;
      }
    }

    return {
      hasData: rows.length > 0,
      count: rows.length,
      estTotal,
      warrantyEnergy,
      producedEnergy,
      progressPercent: warrantyEnergy > 0 ? (producedEnergy / warrantyEnergy) * 100 : 0
    };
  });

  selectedRow = computed<ContractRowModel | null>(() => {
    return this.tableRows().find(x => x.site.id === this.selectedSiteId()) ?? null;
  });

  private httpSrv = inject(HttpService);
  private appInit = inject(AppInitService);
  private dateTimeSrv = inject(Datetime);

  ngOnInit(): void {
    this.initPage();
  }

  ngOnDestroy(): void {
    this.timers?.unsubscribe();
  }

  async initPage(){
    this.timers?.unsubscribe();

    await this.getSiteListData();
    await this.getSlaData();
    await this.getEnergyMtdData();

    if(this.appInit.config.Timer){
      this.startTimer(this.appInit.config.Timer * 60000);
    }
  }

  async getSiteListData(){
    const res = await this.httpSrv.getMasterPlants();
    if(res && res.status === 'success' && res.data){
      const data = res.data.sort((a,b) => a.id - b.id).map(plant => this.toSiteModel(plant));
      this.siteList.set(data);
      await this.getBillingConfigData();
    };
  }

  private toSiteModel(plant: PlantInformationModel): SiteModel {
    return {
      enabled: plant.enable === 1,
      id: plant.siteid,
      name: plant.name ?? plant.siteid,
      project: plant.project ?? '',
      location: plant.location ?? '',
      position: { lat: plant.position_lat ?? 0, lng: plant.position_long ?? 0 },
      capacity: plant.capacity != null ? plant.capacity.toString() : '0',
      cod: plant.cod ?? ''
    };
  }

  async getBillingConfigData(){
    const result = await this.httpSrv.getBillingConfig();
    if(result && result.status === 'success'){
      const sites = result.data.filter(x => x.siteId !== 'global');
      if(sites){
        this.billingConfigs.set(sites);
      }
    }
  }

  // ดึง SLA เฉพาะปีปัจจุบันผ่าน find-by-date (เบากว่า getAllSla ตอนมี site เยอะ)
  // timestamp เก็บที่ต้นปีแบบ local (เช่น ปี 2026 = "2025-12-31T17:00:00Z") จึง query เผื่อขอบปี
  // แล้ว filter ด้วย local year ให้ตรง convention เดียวกับหน้า setting
  async getSlaData(){
    const year = this.date.getFullYear();
    const body: FindSlaByDateRequest = {
      start_time: `${year - 1}-12-31`,
      end_time: `${year}-12-31`
    };
    const res = await this.httpSrv.findSlaByDate(body);
    if(res && res.status === 'success' && res.data){
      const map: Record<string, PlantSlaModel> = {};
      for(const sla of res.data){
        if(new Date(sla.timestamp).getFullYear() !== year){
          continue;
        }
        const existing = map[sla.siteid];
        if(!existing || new Date(sla.timestamp).getTime() > new Date(existing.timestamp).getTime()){
          map[sla.siteid] = sla;
        }
      }
      this.slaData.set(map);
    }
  }

  // energy ต่อ site ผ่าน getattime — แยก request ตาม timestamp ที่ต้องอ่าน:
  // WH_MONTH อ่านที่ต้นเดือน (BOM), WH_YEAR อ่านที่ต้นปี (BOY = 2026-01-01 00:00:00)
  async getEnergyMtdData(){
    const sites = this.siteList();
    if(sites.length === 0){
      return;
    }

    await Promise.all([
      this.fetchEnergyAtTime(sites.map(s => `${s.id}.CALC.WH_MONTH`), this.dateTimeSrv.getTime('BOM', this.date)),
      this.fetchEnergyAtTime(sites.map(s => `${s.id}.CALC.WH_YEAR`), this.dateTimeSrv.getTime('BOY', this.date))
    ]);
  }

  private async fetchEnergyAtTime(tags: string[], timeStamp: string){
    const request: RequestAtTimeModel = { Tags: tags, TimeStamp: timeStamp };
    const response: ResponseHistorianModel[] = await this.httpSrv.getAtTime([request]);
    if(response){
      response.forEach(data => {
        const parts = data.Name.split('.');
        const siteId = parts[0];
        const tag = parts[parts.length - 1]; // WH_MONTH | WH_YEAR
        const record = data.records && data.records.length > 0 ? data.records[0] : null;
        if(!record){
          return;
        }
        this.dataRealtime.update(val => ({
          ...val,
          [`${siteId}_${tag}`]: {
            Name: data.Name,
            Min: data.Min,
            Max: data.Max,
            Unit: data.Unit,
            TimeStamp: record.TimeStamp,
            Value: parseFloat(record.Value.toString().replaceAll(',', ''))
          }
        }));
      });
    }
  }

  startTimer(dueTimer: number) {
    this.timers = timer(dueTimer, dueTimer).subscribe(x => {
      this.updateData();
    });
  }

  async updateData(){
    this.date = new Date();
    await this.getBillingConfigData();
    await this.getSlaData();
    await this.getEnergyMtdData();
  }

  // ย่อจำนวนเงินเป็น K / M / B
  formatShort(value: number): string {
    if (value >= 1e9) {
      return (value / 1e9).toFixed(2) + 'B';
    }
    if (value >= 1e6) {
      const m = value / 1e6;
      return (m >= 100 ? m.toFixed(0) : m.toFixed(1)) + 'M';
    }
    if (value >= 1e3) {
      return (value / 1e3).toFixed(0) + 'K';
    }
    return value.toFixed(0);
  }

  selectSite(siteId: string){
    this.selectedSiteId.set(siteId);
  }

  backToList(){
    this.selectedSiteId.set('');
  }

  getWorkflow(config: BillingConfigModel){
    return [
      { label: 'CONFIRMATION', user: config.confirmation_user.length, account: config.confirmation_account.length, customer: config.confirmation_customer.length },
      { label: 'INVOICE', user: config.invoice_user.length, account: config.invoice_account.length, customer: config.invoice_customer.length },
      { label: 'RECEIPT', user: config.receipt_user.length, account: config.receipt_account.length, customer: config.receipt_customer.length }
    ];
  }

}
