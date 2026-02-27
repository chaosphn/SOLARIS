export interface ConfigModel{
    UrlApi?: string;
    UrlApiAuthen?: string;
    UrlApiBilling?: string;
    UrlApiNotification?: string;
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

export interface PageConfigModel{
    realtimeConfig: GroupReatimeConfigModel[];
    historianConfig: GroupHistorianConfigModel[];
    chartConfig: ChartConfig[];
}

export interface GroupReatimeConfigModel{
    Group: string;
    Order: number;
    Tags: RealtimeConfig[];
}

export interface GroupHistorianConfigModel{
    Group: string;
    Order: number;
    Tags: HistorianConfig[];
}

export interface RealtimeConfig{
    Title: string;
    Tagname: string;
    Timestamp?: string;
}

export interface HistorianConfig{
    Title: string;
    Tagname: string;
    Options: Option
}

export interface Option{
    Interval?: number;
    Time: string;
    StartTime: string;
    EndTime: string;
}

export interface ChartConfig{
    name: string;
    tags: TagsConfig[];
    chartOptions: any
}

export interface TagsConfig{
    name: string;
    title: string;
    options: SeriesOptions;
}

export interface SeriesOptions{
    type: string;
    color: string;
    name: string;
    visible?: boolean;
    showInLegend?: boolean;
    yAxis?: number;
    data?: any[];
    fillOpacity?: number; 
    borderColor?: string;
    borderRadius?: number;
    borderWidth?: number;
}
