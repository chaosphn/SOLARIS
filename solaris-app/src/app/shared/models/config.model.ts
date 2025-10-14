export interface ConfigModel{
    UrlApi?: string;
    UrlApiAuthen?: string;
    Timer?: number;
}

export interface SiteModel{
    id: string;
    name: string;
    project: string;
    location: string;
    capacity: string;
    invtype?: string;
}

export interface ZoneModel{
    title: string;
    number: number;
    capacity: string;
    display: string;
    siteList: SiteModel[];
}

export interface SiteStateModel{
    name: string;
    number: number;
    capacity: string;
    zoneList: ZoneModel[];
}