export interface AlarmTag {
  id: number;
  name: string;
  description: string;
  message: string;
  expression: string;
  tagSync: string;
  destination: {
    telegram: boolean;
    msteam: boolean;
    email: boolean;
  };
}

export interface NotificationConfig {
  telegram: {
    enabled: boolean;
    chatIds: string[];
    display: boolean;
  };
  msteam: {
    enabled: boolean;
    webhookUrls: string[];
    display: boolean;
  };
  email:{
    enabled: boolean;
    address: string[];
    display: boolean;
  };
}

export interface User {
  id: number;
  username: string;
  password: string;
  role: 'administrator' | 'user' ;
  pageAccess: string[];
  siteAccess: string[];
}

export interface BillingConfigModel {
  id: number;
  siteId: string;
  meterType: 'normal' | 'tou';
  billingMode: 'auto' | 'manual';
  energyCost: number;
  onpeakCost: number;
  offpeakCost: number;
  discountRate: number;
  ftRate: number;
  scheduleDate: string;
  scheduleTime: string;
  approvedBy: string;
  approvedCc: string;
  approvedBcc: string;
  receivedBy: string;
  receivedCc: string;
  receivedBcc: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateBillingRequestModel extends Omit<BillingConfigModel, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>{

}

export interface UpdateBillingRequestModel extends Omit<BillingConfigModel, 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>{

}

export interface DeleteBillingRequestModel extends Pick<BillingConfigModel, 'id'>{

}

export interface BillingResponseModel {
  StatusCode: string;
  Message: string;
}

export interface BillingConfigResponseModel {
  status: string;
  data: BillingConfigModel[];
}