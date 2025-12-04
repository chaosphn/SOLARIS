import { Component, effect, EventEmitter, input, Output, signal } from '@angular/core';
import { MapConfigModel } from '../../../../../../shared/models/svg.model';
import { DataRealtimeModel } from '../../../../../../shared/models/response.model';
import { SiteModel } from '../../../../../../shared/models/config.model';


@Component({
  selector: 'app-map-consumption',
  standalone: false,
  templateUrl: './map-consumption.html',
  styleUrl: './map-consumption.scss'
})
export class MapConsumption {

  showDetail = signal<boolean>(false);
  zone = input<string>('');
  config = input<MapConfigModel>();
  data = input<DataRealtimeModel>();
  sites = input<SiteModel[]>([]);
  sitesSummary = signal<any[]>([]);
  @Output() selectZone = new EventEmitter<string>();

  selectedprovince: string = '';
  hoverprovince: string | null = null;

  constructor(){
    effect(() => {
      if(this.sites() && this.config()?.map){
        //console.log(this.sites(), this.config())
        const pvnInZone = this.config()?.map.map(x => x.name.replace(/\s+/g, "").toLowerCase()) || [];
        if(pvnInZone){
          const siteData = this.sites().filter(x => pvnInZone.includes(x.location.toLowerCase())).map(x => ({
            indicator: this.data()?.[`${x.id}_POWER`]?.TimeStamp || '1M', 
            code: x.id, 
            site: x.name, 
            province: x.location, 
            capacityMw: x.capacity, 
            powerKw: this.data()?.[`${x.id}_POWER`]?.Value || '3,230.00', 
            todayMWh: this.data()?.[`${x.id}_ENERGY`]?.Value || '24.50', 
            irr: this.data()?.[`${x.id}_PYRONO`]?.Value || '690.83', 
            pvTemp: this.data()?.[`${x.id}_PVTEMP`]?.Value || '53.8', 
            ambTemp: this.data()?.[`${x.id}_AMBTEMP`]?.Value || '34.2'
          }));
          this.sitesSummary.set(siteData);
        }
      }
    })
  }

  mockRows = [
    { indicator: '1M', code: 'SITE001', site: 'SITE ALPHA', province: 'BANGKOK', capacityMw: 6.0, powerKw: 3372, todayMWh: 32, irr: 742, pvTemp: 55.4, ambTemp: 36.1 },
    { indicator: '1M', code: 'SITE002', site: 'SITE BETA', province: 'PATHUM THANI', capacityMw: 4.5, powerKw: 2890, todayMWh: 21, irr: 680, pvTemp: 53.2, ambTemp: 35.0 },
    { indicator: '2M', code: 'SITE003', site: 'SITE GAMMA', province: 'AYUTTHAYA', capacityMw: 5.2, powerKw: 3055, todayMWh: 25, irr: 710, pvTemp: 54.1, ambTemp: 34.6 },
    { indicator: '2M', code: 'SITE004', site: 'SITE DELTA', province: 'NONTHABURI', capacityMw: 3.8, powerKw: 2104, todayMWh: 18, irr: 600, pvTemp: 50.0, ambTemp: 33.8 },
    { indicator: '3M', code: 'SITE005', site: 'SITE EPSILON', province: 'SARABURI', capacityMw: 2.9, powerKw: 1650, todayMWh: 12, irr: 520, pvTemp: 48.3, ambTemp: 32.5 },
    { indicator: '3M', code: 'SITE006', site: 'SITE ZETA', province: 'LOPBURI', capacityMw: 7.1, powerKw: 3602, todayMWh: 34, irr: 755, pvTemp: 56.0, ambTemp: 36.5 },
    { indicator: '3M', code: 'SITE005', site: 'SITE EPSILON', province: 'SARABURI', capacityMw: 2.9, powerKw: 1650, todayMWh: 12, irr: 520, pvTemp: 48.3, ambTemp: 32.5 },
    { indicator: '3M', code: 'SITE006', site: 'SITE ZETA', province: 'LOPBURI', capacityMw: 7.1, powerKw: 3602, todayMWh: 34, irr: 755, pvTemp: 56.0, ambTemp: 36.5 }
  ];

  handleProvinceHover = (provinceId: string | null) => {
    this.hoverprovince = provinceId;
    //console.log(this.hoverprovince)
  };

  getProvinceStyle = (provinceId: string, idx: number) => {
    const isHovered = this.hoverprovince === provinceId;
   
    if (isHovered) {
      return {
        fill: 'var(--map-hover)',
        strokeWidth: '1.5',
        cursor: 'pointer',
      };
    }  else {
      return {
        //fill: 'var(--map-bg)',
        cursor: 'pointer'
      };
    }
  };

  getProviceBackground(provinceId: string, color: string){
    const pvnName = provinceId.replace(/\s+/g, "").toLowerCase();
    const findProvince = this.sites().findIndex(x => x.location.toLowerCase() == pvnName);
    return findProvince > -1 ? `${color}` : 'var(--map-bg)'
  }

  zoominSelectedZone(zone: string){
    this.selectZone.emit(zone);
  }

  getProvinceNum(name: string){
    if(!this.config()?.map){
      return 0;
    }
    const pvnInZone = this.config()?.map.filter(x => x.zone.toLowerCase() == name).map(x => x.name.replaceAll(' ', '').toLowerCase()) || [];
    if(pvnInZone){
      return this.sites().filter(x => pvnInZone.includes(x.location.toLowerCase())).length
    } else {
      return 0
    }; 
  }

  getProvinceCap(name: string){
    if(!this.config()?.map){
      return 0;
    }
    const pvnInZone = this.config()?.map.filter(x => x.zone.toLowerCase() == name).map(x => x.name.replaceAll(' ', '').toLowerCase()) || [];
    if(pvnInZone){
      return this.sites().filter(x => pvnInZone.includes(x.location.toLowerCase())).reduce((acc, cur) => {
        if(cur && cur.capacity){
          acc = acc + parseFloat(cur.capacity);
        }
        return acc;
      }, 0).toFixed(2);
    } else {
      return 0
    }; 
  }

}
