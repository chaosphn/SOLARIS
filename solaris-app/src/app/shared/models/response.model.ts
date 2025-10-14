export interface ResponseRealtimeModel{
   Name: string;
   Unit: string;
   Value: string;
   TimeStamp: string;
   Min: number;
   Max: number;
}

export interface ResponseHistorianModel{
    Name: string;
    Unit: string;
    Min: number;
    Max: number;
    records: Record[];
}

export interface Record{
    Value: string;
    TimeStamp: string;
}

export interface DataRealtimeModel{
    [name:string]: ResponseRealtimeModel;
}

