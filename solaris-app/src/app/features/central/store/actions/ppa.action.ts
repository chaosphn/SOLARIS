import { createAction, props } from '@ngrx/store';
import { SiteModel } from '../../../../shared/models/config.model';
import { PlantSlaModel } from '../../../../shared/models/masterdata.model';
import { BillingConfigModel } from '../../models/billing.model';

export const setPpaSiteList = createAction(
  '[PPA] Set Site List',
  props<{ siteList: SiteModel[] }>()
);

export const setPpaBillingConfigs = createAction(
  '[PPA] Set Billing Configs',
  props<{ billingConfigs: BillingConfigModel[] }>()
);

export const setPpaSlaData = createAction(
  '[PPA] Set SLA Data',
  props<{ slaData: Record<string, PlantSlaModel> }>()
);

export const setPpaRealtimeData = createAction(
  '[PPA] Set Realtime Data',
  props<{ realtimeData: Record<string, number> }>()
);

export const setPpaMonthlyEnergy = createAction(
  '[PPA] Set Monthly Energy',
  props<{ monthlyEnergy: Record<string, (number | null)[]> }>()
);

export const setPpaSlaByYear = createAction(
  '[PPA] Set SLA By Year',
  props<{ slaByYear: Record<string, Record<number, PlantSlaModel>> }>()
);

export const setPpaSlaHistoryTimestamp = createAction(
  '[PPA] Set SLA History Timestamp',
  props<{ slaHistoryTimestamp: Date }>()
);

export const setPpaTimestamp = createAction(
  '[PPA] Set Timestamp',
  props<{ timestamp: Date }>()
);

export const resetPpaState = createAction(
  '[PPA] Reset State'
);
