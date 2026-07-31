export interface ConfigModel{
    UrlApi?: string;
    UrlApiAuthen?: string;
    UrlApiBilling?: string;
    UrlApiNotification?: string;
    UrlApiMaintenance?: string;
    UrlApiMasterData?: string;
    Timer?: number;
}

export interface SiteModel{
    enabled: boolean;
    id: string;
    name: string;
    project: string;
    location: string;
    position: PositionModel;
    capacity: string;
    capacity_dc?: string;
    invtype?: string;
    cod: string;
}

export interface PositionModel{
    lat: number;
    lng: number;
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
    TimeSpan?: string;
    Type?: 'raw' | 'sampling' | 'plot';
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
    time?: string;
    dataType?: TagDataTypeConfig;
    options: SeriesOptions;
}

export interface TagDataTypeConfig{
    type: 'raw' | 'sampling' | 'plot';
    interval?: number;
    timespan?: string;
}

export interface SeriesOptions{
    type: string;
    color: string;
    name: string;
    visible?: boolean;
    showInLegend?: boolean;
    dashStyle?: string;
    yAxis?: number;
    data?: any[];
    fillOpacity?: number; 
    borderColor?: string;
    borderRadius?: number;
    borderWidth?: number;
}
