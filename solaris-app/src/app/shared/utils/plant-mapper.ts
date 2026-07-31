import { SiteModel, SiteStateModel, ZoneModel } from '../models/config.model';
import { PlantInformationModel } from '../models/masterdata.model';

// แปลงข้อมูล plant จาก master data API ให้อยู่ใน format เดียวกับ assets/sitelist.json
export function mapPlantsToSiteList(plants: PlantInformationModel[]): SiteModel[] {
    return plants.map(p => ({
        enabled: p.enable === 1,
        id: p.siteid,
        name: p.name ?? p.siteid,
        project: p.project ?? p.siteid,
        location: p.location ?? '',
        position: {
            lat: p.position_lat ?? 0,
            lng: p.position_long ?? 0
        },
        capacity: String(p.capacity ?? 0),
        capacity_dc: p.capacity_dc != null ? String(p.capacity_dc) : undefined,
        cod: p.cod ?? ''
    }));
}

export function mapPlantsToSiteState(plants: PlantInformationModel[]): SiteStateModel {
    const siteList = mapPlantsToSiteList(plants);

    const totalCapacity = String(+siteList
        .reduce((sum, s) => sum + (parseFloat(s.capacity) || 0), 0)
        .toFixed(3));

    const zone: ZoneModel = {
        title: 'ALL',
        display: 'ALL',
        number: siteList.length,
        capacity: totalCapacity,
        siteList
    };

    return {
        name: 'OVERVIEW',
        number: siteList.length,
        capacity: totalCapacity,
        zoneList: [zone]
    };
}
