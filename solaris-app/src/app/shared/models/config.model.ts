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
    chartOptions: any;
    /** ระบายสีแท่ง/จุดของ series ตามค่าที่เทียบกับเส้นฐาน เช่น เทียบพลังงานรายเดือนกับหน่วยการันตี */
    colorBands?: ChartColorBandsConfig;
}

/** เกณฑ์สีของ series หนึ่งชุด อ้างอิงกับค่าฐานที่คำนวณได้ตอน runtime */
export interface ChartColorBandsConfig{
    /** title ของ series ที่จะระบายสี ต้องตรงกับ tags[].title */
    series: string;
    /**
     * ค่าฐานที่ใช้เทียบ รองรับรูปแบบเดียวกับ plotLines.value
     * 'tagValue:<TAG>:<factor>' | 'maxValue' | 'minValue' | 'averageValue' | ตัวเลขตรงๆ
     */
    baseline: string | number;
    /** ป้ายกำกับของค่าฐาน ใช้แสดงในแถบคำอธิบายสี */
    baselineLabel?: string;
    /** เรียงจากช่วงสูงสุดลงต่ำสุด ระบบจะหยิบช่วงแรกที่ percent >= min */
    bands: ChartColorBandModel[];
}

export interface ChartColorBandModel{
    /** ขอบล่างของช่วง คิดเป็น % ของค่าฐาน */
    min: number;
    color: string;
    title: string;
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
    /** สีของกล่องสีใน legend — ใช้เมื่อ color ของ series โปร่งจนมองไม่เห็นใน legend */
    legendSymbolColor?: string;
}
