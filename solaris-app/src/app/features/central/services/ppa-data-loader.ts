import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '../../../shared/services/http.service';
import { Datetime } from '../../../shared/services/datetime';
import { PageConfigModel, SiteModel } from '../../../shared/models/config.model';
import { PlantInformationModel, PlantSlaModel, FindSlaByDateRequest } from '../../../shared/models/masterdata.model';
import { ResponseHistorianModel, ResponseRealtimeModel } from '../../../shared/models/response.model';
import * as PpaActions from '../store/actions/ppa.action';
import { selectPpaTimestamp, selectPpaSiteList, selectPpaBillingConfigs, selectPpaSlaHistoryTimestamp } from '../store/selectors/ppa.selector';
import { parseContactCost } from '../models/contract.model';
import { BillingConfigModel } from '../models/billing.model';

const CONFIG_PATH = 'assets/central/ppa/configurations/ppa.config.json';
const FRESH_MINUTES = 2;
const FRESH_HISTORY_MINUTES = 10;   // SLA ตลอดสัญญาเปลี่ยนน้อย → cache นานกว่า

/**
 * ตัวโหลดข้อมูลกลางของกลุ่ม PPA — ยิง API แล้ว dispatch เข้า ngrx (state อยู่ใน store)
 * ensureLoaded() เช็ค timestamp: ถ้า fresh < 2 นาที = ข้าม → สลับหน้าไม่ยิงซ้ำ
 */
@Injectable({ providedIn: 'root' })
export class PpaDataLoader {
  private http = inject(HttpService);
  private dateTimeSrv = inject(Datetime);
  private store = inject(Store);

  private config: PageConfigModel | null = null;
  private inflight: Promise<void> | null = null;
  private slaHistoryInflight: Promise<void> | null = null;

  async ensureLoaded(force = false): Promise<void> {
    if (!force) {
      const ts = await firstValueFrom(this.store.select(selectPpaTimestamp));
      if (ts && (Date.now() - new Date(ts).getTime()) / 60000 < FRESH_MINUTES) {
        return;
      }
    }
    // กัน 2 หน้าเรียกพร้อมกัน → รอ request เดียว
    if (this.inflight) { return this.inflight; }
    this.inflight = this.loadAll().finally(() => { this.inflight = null; });
    return this.inflight;
  }

  /**
   * โหลด SLA ตลอดอายุสัญญา (หลายปี) ต่อ site — ใช้โดย Tariff Escalation / Financial Analysis
   * ยิงทีละ site (sequential) เพื่อไม่ถล่ม API, cache แยกใน store (freshness 10 นาที)
   */
  async ensureSlaHistory(force = false): Promise<void> {
    if (!force) {
      const ts = await firstValueFrom(this.store.select(selectPpaSlaHistoryTimestamp));
      if (ts && (Date.now() - new Date(ts).getTime()) / 60000 < FRESH_HISTORY_MINUTES) {
        return;
      }
    }
    if (this.slaHistoryInflight) { return this.slaHistoryInflight; }
    this.slaHistoryInflight = this.loadSlaHistory().finally(() => { this.slaHistoryInflight = null; });
    return this.slaHistoryInflight;
  }

  private async getConfig(): Promise<PageConfigModel> {
    if (!this.config) {
      this.config = await this.http.getConfig2(CONFIG_PATH);
    }
    return this.config!;
  }

  private async loadAll(): Promise<void> {
    const config = await this.getConfig();
    const date = new Date();

    const siteList = await this.loadSites();
    this.store.dispatch(PpaActions.setPpaSiteList({ siteList }));

    await Promise.all([
      this.loadBilling(),
      this.loadSla(date),
      this.loadRealtime(siteList, config),
      this.loadMonthlyEnergy(siteList, config, date)
    ]);

    this.store.dispatch(PpaActions.setPpaTimestamp({ timestamp: new Date() }));
  }

  private async loadSites(): Promise<SiteModel[]> {
    const res = await this.http.getMasterPlants();
    if (res && res.status === 'success' && res.data) {
      return res.data.sort((a,b) => a.id - b.id).map(p => this.toSiteModel(p));
    }
    return [];
  }

  private async loadBilling(): Promise<void> {
    const res = await this.http.getBillingConfig();
    if (res && res.status === 'success') {
      this.store.dispatch(PpaActions.setPpaBillingConfigs({ billingConfigs: res.data.filter(x => x.siteId !== 'global') }));
    }
  }

  private async loadSla(date: Date): Promise<void> {
    const year = date.getFullYear();
    const body: FindSlaByDateRequest = { start_time: `${year - 1}-12-31`, end_time: `${year}-12-31` };
    const res = await this.http.findSlaByDate(body);
    if (res && res.status === 'success' && res.data) {
      const map: Record<string, PlantSlaModel> = {};
      for (const sla of res.data) {
        if (new Date(sla.timestamp).getFullYear() !== year) { continue; }
        const existing = map[sla.siteid];
        if (!existing || new Date(sla.timestamp).getTime() > new Date(existing.timestamp).getTime()) {
          map[sla.siteid] = sla;
        }
      }
      this.store.dispatch(PpaActions.setPpaSlaData({ slaData: map }));
    }
  }

  private async loadSlaHistory(): Promise<void> {
    await this.ensureLoaded();   // ต้องมี siteList + billingConfigs ก่อน
    const sites = await firstValueFrom(this.store.select(selectPpaSiteList));
    const configs = await firstValueFrom(this.store.select(selectPpaBillingConfigs));
    const now = new Date();
    const curYear = now.getFullYear();

    const slaByYear: Record<string, Record<number, PlantSlaModel>> = {};

    // ยิงทีละ site ตามลำดับ
    for (const s of sites) {
      const cfg: BillingConfigModel | undefined = configs.find(c => c.siteId === s.id);
      // ช่วงสัญญา = จาก contactCost schedule (PPA เท่านั้นมีปี); ไม่มี → ปีปัจจุบัน
      let startYear = curYear;
      let endYear = curYear;
      if (cfg) {
        const parsed = parseContactCost(cfg.contactType, cfg.contactCost, now);
        if (parsed?.startDate && parsed?.endDate) {
          startYear = parsed.startDate.getFullYear();
          endYear = parsed.endDate.getFullYear();
        }
      }

      // start เผื่อ 1 ปี (record ปี Y เก็บ timestamp ต้นปี local = ปลายปี Y-1 UTC เหมือน loadSla)
      const body: FindSlaByDateRequest = {
        start_time: `${startYear - 1}-12-31`,
        end_time: `${endYear}-12-31`,
        siteid: s.id
      };
      const res = await this.http.findSlaByDate(body);
      const byYear: Record<number, PlantSlaModel> = {};
      if (res && res.status === 'success' && res.data) {
        for (const sla of res.data) {
          const y = new Date(sla.timestamp).getFullYear();   // local year
          if (y < startYear || y > endYear) { continue; }
          const existing = byYear[y];
          if (!existing || new Date(sla.timestamp).getTime() > new Date(existing.timestamp).getTime()) {
            byYear[y] = sla;
          }
        }
      }
      slaByYear[s.id] = byYear;
    }

    this.store.dispatch(PpaActions.setPpaSlaByYear({ slaByYear }));
    this.store.dispatch(PpaActions.setPpaSlaHistoryTimestamp({ slaHistoryTimestamp: new Date() }));
  }

  private async loadRealtime(sites: SiteModel[], config: PageConfigModel): Promise<void> {
    const groups = config.realtimeConfig;
    if (sites.length === 0 || groups.length === 0) { return; }

    const suffixToTitle = new Map<string, string>();
    const tags: string[] = [];
    for (const g of groups) {
      for (const t of g.Tags) {
        suffixToTitle.set(t.Tagname.replace('{SITE}.', ''), t.Title);
        sites.forEach(s => tags.push(t.Tagname.replace('{SITE}', s.id)));
      }
    }

    const response: ResponseRealtimeModel[] = await this.http.getRealtime({ Tags: tags });
    if (response) {
      const map: Record<string, number> = {};
      response.forEach(d => {
        const parts = d.Name.split('.');
        const siteId = parts[0];
        const title = suffixToTitle.get(parts.slice(1).join('.'));
        const v = parseFloat(d.Value?.toString().replaceAll(',', '') ?? '');
        if (title && !isNaN(v)) { map[`${siteId}_${title}`] = v; }
      });
      this.store.dispatch(PpaActions.setPpaRealtimeData({ realtimeData: map }));
    }
  }

  private async loadMonthlyEnergy(sites: SiteModel[], config: PageConfigModel, date: Date): Promise<void> {
    const group = config.historianConfig.find(g => g.Group === 'monthlyEnergy');
    const tag = group?.Tags.find(t => t.Title === 'WH_MONTH');
    if (sites.length === 0 || !tag) { return; }

    const year = date.getFullYear();
    const curMonth = date.getMonth();
    const tags = sites.map(s => tag.Tagname.replace('{SITE}', s.id));
    const period = tag.Options.StartTime || 'BOM';

    const energy: Record<string, (number | null)[]> = {};
    sites.forEach(s => energy[s.id] = new Array(12).fill(null));

    const jobs: Promise<void>[] = [];
    for (let m = 0; m <= curMonth; m++) {
      const ts = this.dateTimeSrv.getTime(period, new Date(year, m, 1));
      jobs.push(this.fetchMonthEnergy(tags, ts, m, energy));
    }
    await Promise.all(jobs);
    this.store.dispatch(PpaActions.setPpaMonthlyEnergy({ monthlyEnergy: energy }));
  }

  private async fetchMonthEnergy(tags: string[], timeStamp: string, monthPos: number, energy: Record<string, (number | null)[]>): Promise<void> {
    const response: ResponseHistorianModel[] = await this.http.getAtTime([{ Tags: tags, TimeStamp: timeStamp }]);
    if (response) {
      response.forEach(data => {
        const siteId = data.Name.split('.')[0];
        const record = data.records && data.records.length > 0 ? data.records[0] : null;
        if (record && energy[siteId]) {
          energy[siteId][monthPos] = parseFloat(record.Value.toString().replaceAll(',', ''));
        }
      });
    }
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
}
