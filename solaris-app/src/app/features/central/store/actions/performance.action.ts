import { createAction, props } from '@ngrx/store';
import { PageConfigModel } from '../../../../shared/models/config.model';
import { GroupRequestAtTimeModel, GroupRequestHistorianModel, GroupRequestRealtimeModel } from '../../../../shared/models/request.model';
import { DataHistorianModel, DataRealtimeModel } from '../../../../shared/models/response.model';


// Load Overview Config Actions
export const loadPerformanceConfig = createAction(
  '[Performance] Load Config'
);

export const loadPerformanceConfigTimeStamp = createAction(
    '[Performance] Timestamp Load Config',
    props<{ timestamp: Date }>()
  );

export const loadPerformanceConfigSuccess = createAction(
  '[Performance] Load Config Success',
  props<{ config: PageConfigModel }>()
);

export const loadPerformanceConfigFailure = createAction(
  '[Performance] Load Config Failure',
  props<{ error: string }>()
);

// Load Realtime Data Actions
export const loadPerformanceRealtimeData = createAction(
  '[Performance] Load Realtime Data',
  props<{ requests: GroupRequestRealtimeModel[] }>()
);

export const loadPerformanceRealtimeDataSuccess = createAction(
  '[Performance] Load Realtime Data Success',
  props<{ data: DataRealtimeModel }>()
);

export const loadPerformanceRealtimeDataFailure = createAction(
  '[Performance] Load Realtime Data Failure',
  props<{ error: string }>()
);

// Load At Time Data Actions
export const loadPerformanceAtTimeData = createAction(
  '[Performance] Load At Time Data',
  props<{ requests: GroupRequestAtTimeModel[] }>()
);

export const loadPerformanceAtTimeDataSuccess = createAction(
  '[Performance] Load At Time Data Success',
  props<{ data: DataRealtimeModel }>()
);

export const loadPerformanceAtTimeDataFailure = createAction(
  '[Performance] Load At Time Data Failure',
  props<{ error: string }>()
);

// Load Historian Data Actions
export const loadPerformanceHistorianData = createAction(
  '[Performance] Load Historian Data',
  props<{ requests: GroupRequestHistorianModel[] }>()
);

export const loadPerformanceHistorianDataSuccess = createAction(
  '[Performance] Load Historian Data Success',
  props<{ data: DataHistorianModel }>()
);

export const loadPerformanceHistorianDataFailure = createAction(
  '[Performance] Load Historian Data Failure',
  props<{ error: string }>()
);

// Load Chart Data Actions
export const loadPerformanceChartData = createAction(
  '[Performance] Load Chart Data'
);

export const loadPerformanceChartDataSuccess = createAction(
  '[Performance] Load Chart Data Success',
  props<{ data: any }>()
);

export const loadPerformanceChartDataFailure = createAction(
  '[Performance] Load Chart Data Failure',
  props<{ error: string }>()
);

// Reset Performance State
export const resetPerformanceState = createAction(
  '[Performance] Reset State'
);
