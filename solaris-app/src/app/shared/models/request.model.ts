

export interface RequestRealtimeModel{
    Tags: string[];
}

export interface RequestHistorianModel{
    Name: string;
    Options: Option;
}

export interface RequestRealtime2Model{
   [name: string]: RequestRealtimeModel;
}

export interface RequestHistorian2Model{
    [name: string]: RequestHistorianModel[];
}

export interface Option{
    Interval?: number;
    Time: string;
    StartTime: string;
    EndTime: string;
}