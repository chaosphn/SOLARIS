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
  role: 'administrator' | 'user';
  pageAccess: string[];
  siteAccess: string[];
}

export interface BillingConfigModel {
  id: number;
  siteName: string;
  meterMode: 'normal' | 'tou';
  energyCost?: number;
  onpeakCost?: number;
  offpeakCost?: number;
  discountCost: number;
  ftCost: number;
  co2Ratio: number;
  fuelRatio: number;
  treeRatio: number;
  emails: string;
}
