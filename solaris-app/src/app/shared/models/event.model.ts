export interface DisplayTag{
    tagname: string;
    display: string;
}

export interface TagChanged{
    tagname: string;
    status: boolean;
}

export interface EventConfigModel{
    Status: EventGroupModel[];
    Type: EventGroupModel[];
    Assets: EventGroupModel[];
}

export interface EventItemModel{
    name: string;
    groupName?: string;
    groupOrder?: number;
}

export interface EventGroupModel{
    name: string;
    equipments: EventItemModel[];
}

export interface EventRequestModel{
    Status: string[];
    Type: string[];
    Assets: string[];
    StartTime: string;
    EndTime: string;
}

export interface EventResponseModel{
    Status: string;
    Type: string;
    Assets: string;
    TimeStamp: string;
    Messege: string;
}