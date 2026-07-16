export interface RealtimeDataModel{
    group: string;
    alias: DataAliasModel[];
}

export interface DataAliasModel{
    name: string;
    status: string;
    data: DataModel[];
}

export interface DataModel{
    title: string;
    unit:string;
    value: string;
}

export interface EmitResult{
    tag: string[];
    table: RealtimeDataModel[];
}

export interface EmitPeriodResult{
    startDate: string;
    endDate: string;
    tagsList: string[];
}

export interface TagsListConfig{
    name: string;
    equipments: Equipments[];
    parameters: TagParameter[];
    mapping?: { [param: string]: StatusMapping };
}

export interface StatusMapping{
    type: 'enum' | 'bitfield';
    values?: { [code: string]: { label: string; level: string } };
    bits?: { bit: number; name: string; level: string }[];
}

export interface DecodedAlarm{
    name: string;
    level: string;
}

export interface Equipments{
    name: string;
    groupName?: string;
    groupOrder?: number;
}

export interface TagParameter{
    name: string;
    title?: string;
    uom?: string;
    width?: string;
    type?: string;
    sheets?: string[];
    scale?: string;
    dataType?: string;
    groupName?: string;
    groupOrder?: number;
}

export interface AliasList{
    name: string;
    status: boolean;
}

export interface TagsConfigList{
    Name: string;
    Status: boolean;
    Alias: AliasList[];
}