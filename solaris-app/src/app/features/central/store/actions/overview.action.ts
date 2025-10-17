import { createAction, props } from '@ngrx/store';
import { PageConfigModel } from '../../../../shared/models/config.model';
import { GroupRequestAtTimeModel, GroupRequestHistorianModel, GroupRequestRealtimeModel } from '../../../../shared/models/request.model';
import { DataHistorianModel, DataRealtimeModel } from '../../../../shared/models/response.model';


// Load Overview Config Actions
export const loadOverviewConfig = createAction(
  '[Overview] Load Config'
);

export const loadOverviewConfigTimeStamp = createAction(
    '[Overview] Timestamp Load Config',
    props<{ timestamp: Date }>()
  );

export const loadOverviewConfigSuccess = createAction(
  '[Overview] Load Config Success',
  props<{ config: PageConfigModel }>()
);

export const loadOverviewConfigFailure = createAction(
  '[Overview] Load Config Failure',
  props<{ error: string }>()
);

// Load Realtime Data Actions
export const loadOverviewRealtimeData = createAction(
  '[Overview] Load Realtime Data',
  props<{ requests: GroupRequestRealtimeModel[] }>()
);

export const loadOverviewRealtimeDataSuccess = createAction(
  '[Overview] Load Realtime Data Success',
  props<{ data: DataRealtimeModel }>()
);

export const loadOverviewRealtimeDataFailure = createAction(
  '[Overview] Load Realtime Data Failure',
  props<{ error: string }>()
);

// Load At Time Data Actions
export const loadOverviewAtTimeData = createAction(
  '[Overview] Load At Time Data',
  props<{ requests: GroupRequestAtTimeModel[] }>()
);

export const loadOverviewAtTimeDataSuccess = createAction(
  '[Overview] Load At Time Data Success',
  props<{ data: DataRealtimeModel }>()
);

export const loadOverviewAtTimeDataFailure = createAction(
  '[Overview] Load At Time Data Failure',
  props<{ error: string }>()
);

// Load Historian Data Actions
export const loadOverviewHistorianData = createAction(
  '[Overview] Load Historian Data',
  props<{ requests: GroupRequestHistorianModel[] }>()
);

export const loadOverviewHistorianDataSuccess = createAction(
  '[Overview] Load Historian Data Success',
  props<{ data: DataHistorianModel }>()
);

export const loadOverviewHistorianDataFailure = createAction(
  '[Overview] Load Historian Data Failure',
  props<{ error: string }>()
);

// Load Chart Data Actions
export const loadOverviewChartData = createAction(
  '[Overview] Load Chart Data'
);

export const loadOverviewChartDataSuccess = createAction(
  '[Overview] Load Chart Data Success',
  props<{ data: any }>()
);

export const loadOverviewChartDataFailure = createAction(
  '[Overview] Load Chart Data Failure',
  props<{ error: string }>()
);

// Reset Overview State
export const resetOverviewState = createAction(
  '[Overview] Reset State'
);
