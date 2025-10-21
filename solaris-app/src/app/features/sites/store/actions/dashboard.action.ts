import { createAction, props } from '@ngrx/store';
import { PageConfigModel } from '../../../../shared/models/config.model';
import { GroupRequestAtTimeModel, GroupRequestHistorianModel, GroupRequestRealtimeModel } from '../../../../shared/models/request.model';
import { DataHistorianModel, DataRealtimeModel } from '../../../../shared/models/response.model';


// Load Dashboard Config Actions
export const loadDashboardConfig = createAction(
  '[Dashboard] Load Config'
);

export const loadDashboardConfigTimeStamp = createAction(
    '[Dashboard] Timestamp Load Config',
    props<{ timestamp: Date }>()
  );

export const loadDashboardConfigSuccess = createAction(
  '[Dashboard] Load Config Success',
  props<{ config: PageConfigModel }>()
);

export const loadDashboardConfigFailure = createAction(
  '[Dashboard] Load Config Failure',
  props<{ error: string }>()
);

// Load Realtime Data Actions
export const loadDashboardRealtimeData = createAction(
  '[Dashboard] Load Realtime Data',
  props<{ requests: GroupRequestRealtimeModel[] }>()
);

export const loadDashboardRealtimeDataSuccess = createAction(
  '[Dashboard] Load Realtime Data Success',
  props<{ data: DataRealtimeModel }>()
);

export const loadDashboardRealtimeDataFailure = createAction(
  '[Dashboard] Load Realtime Data Failure',
  props<{ error: string }>()
);

// Load At Time Data Actions
export const loadDashboardAtTimeData = createAction(
  '[Dashboard] Load At Time Data',
  props<{ requests: GroupRequestAtTimeModel[] }>()
);

export const loadDashboardAtTimeDataSuccess = createAction(
  '[Dashboard] Load At Time Data Success',
  props<{ data: DataRealtimeModel }>()
);

export const loadDashboardAtTimeDataFailure = createAction(
  '[Dashboard] Load At Time Data Failure',
  props<{ error: string }>()
);

// Load Historian Data Actions
export const loadDashboardHistorianData = createAction(
  '[Dashboard] Load Historian Data',
  props<{ requests: GroupRequestHistorianModel[] }>()
);

export const loadDashboardHistorianDataSuccess = createAction(
  '[Dashboard] Load Historian Data Success',
  props<{ data: DataHistorianModel }>()
);

export const loadDashboardHistorianDataFailure = createAction(
  '[Dashboard] Load Historian Data Failure',
  props<{ error: string }>()
);

// Load Chart Data Actions
export const loadDashboardChartData = createAction(
  '[Dashboard] Load Chart Data'
);

export const loadDashboardChartDataSuccess = createAction(
  '[Dashboard] Load Chart Data Success',
  props<{ data: any }>()
);

export const loadDashboardChartDataFailure = createAction(
  '[Dashboard] Load Chart Data Failure',
  props<{ error: string }>()
);

// Reset Dashboard State
export const resetDashboardState = createAction(
  '[Dashboard] Reset State'
);
