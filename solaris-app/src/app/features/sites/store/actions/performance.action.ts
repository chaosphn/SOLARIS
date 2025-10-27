import { createAction, props } from '@ngrx/store';
import { PageConfigModel } from '../../../../shared/models/config.model';
import { GroupRequestAtTimeModel, GroupRequestHistorianModel, GroupRequestRealtimeModel } from '../../../../shared/models/request.model';
import { DataHistorianModel, DataRealtimeModel } from '../../../../shared/models/response.model';


// Load Efficiency Config Actions
export const loadEfficiencyConfig = createAction(
  '[Efficiency] Load Config'
);

export const loadEfficiencyConfigTimeStamp = createAction(
    '[Efficiency] Timestamp Load Config',
    props<{ timestamp: Date }>()
  );

export const loadEfficiencyConfigSuccess = createAction(
  '[Efficiency] Load Config Success',
  props<{ config: PageConfigModel }>()
);

export const loadEfficiencyConfigFailure = createAction(
  '[Efficiency] Load Config Failure',
  props<{ error: string }>()
);

// Load Realtime Data Actions
export const loadEfficiencyRealtimeData = createAction(
  '[Efficiency] Load Realtime Data',
  props<{ requests: GroupRequestRealtimeModel[] }>()
);

export const loadEfficiencyRealtimeDataSuccess = createAction(
  '[Efficiency] Load Realtime Data Success',
  props<{ data: DataRealtimeModel }>()
);

export const loadEfficiencyRealtimeDataFailure = createAction(
  '[Efficiency] Load Realtime Data Failure',
  props<{ error: string }>()
);

// Load At Time Data Actions
export const loadEfficiencyAtTimeData = createAction(
  '[Efficiency] Load At Time Data',
  props<{ requests: GroupRequestAtTimeModel[] }>()
);

export const loadEfficiencyAtTimeDataSuccess = createAction(
  '[Efficiency] Load At Time Data Success',
  props<{ data: DataRealtimeModel }>()
);

export const loadEfficiencyAtTimeDataFailure = createAction(
  '[Efficiency] Load At Time Data Failure',
  props<{ error: string }>()
);

// Load Historian Data Actions
export const loadEfficiencyHistorianData = createAction(
  '[Efficiency] Load Historian Data',
  props<{ requests: GroupRequestHistorianModel[] }>()
);

export const loadEfficiencyHistorianDataSuccess = createAction(
  '[Efficiency] Load Historian Data Success',
  props<{ data: DataHistorianModel }>()
);

export const loadEfficiencyHistorianDataFailure = createAction(
  '[Efficiency] Load Historian Data Failure',
  props<{ error: string }>()
);

// Load Chart Data Actions
export const loadEfficiencyChartData = createAction(
  '[Efficiency] Load Chart Data'
);

export const loadEfficiencyChartDataSuccess = createAction(
  '[Efficiency] Load Chart Data Success',
  props<{ data: any }>()
);

export const loadEfficiencyChartDataFailure = createAction(
  '[Efficiency] Load Chart Data Failure',
  props<{ error: string }>()
);

// Reset Efficiency State
export const resetEfficiencyState = createAction(
  '[Efficiency] Reset State'
);
