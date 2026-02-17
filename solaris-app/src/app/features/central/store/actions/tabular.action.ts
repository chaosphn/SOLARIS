import { createAction, props } from '@ngrx/store';
import { PageConfigModel } from '../../../../shared/models/config.model';
import { GroupRequestAtTimeModel, GroupRequestHistorianModel, GroupRequestRealtimeModel } from '../../../../shared/models/request.model';
import { DataHistorianModel, DataRealtimeModel } from '../../../../shared/models/response.model';


// Load Tabular Config Actions
export const loadTabularConfig = createAction(
  '[Tabular] Load Config'
);

export const loadTabularConfigTimeStamp = createAction(
    '[Tabular] Timestamp Load Config',
    props<{ timestamp: Date }>()
  );

export const loadTabularConfigSuccess = createAction(
  '[Tabular] Load Config Success',
  props<{ config: PageConfigModel }>()
);

export const loadTabularConfigFailure = createAction(
  '[Tabular] Load Config Failure',
  props<{ error: string }>()
);

// Load Realtime Data Actions
export const loadTabularRealtimeData = createAction(
  '[Tabular] Load Realtime Data',
  props<{ requests: GroupRequestRealtimeModel[] }>()
);

export const loadTabularRealtimeDataSuccess = createAction(
  '[Tabular] Load Realtime Data Success',
  props<{ data: DataRealtimeModel }>()
);

export const loadTabularRealtimeDataFailure = createAction(
  '[Tabular] Load Realtime Data Failure',
  props<{ error: string }>()
);

// Load At Time Data Actions
export const loadTabularAtTimeData = createAction(
  '[Tabular] Load At Time Data',
  props<{ requests: GroupRequestAtTimeModel[] }>()
);

export const loadTabularAtTimeDataSuccess = createAction(
  '[Tabular] Load At Time Data Success',
  props<{ data: DataRealtimeModel }>()
);

export const loadTabularAtTimeDataFailure = createAction(
  '[Tabular] Load At Time Data Failure',
  props<{ error: string }>()
);

// Load Historian Data Actions
export const loadTabularHistorianData = createAction(
  '[Tabular] Load Historian Data',
  props<{ requests: GroupRequestHistorianModel[] }>()
);

export const loadTabularHistorianDataSuccess = createAction(
  '[Tabular] Load Historian Data Success',
  props<{ data: DataHistorianModel }>()
);

export const loadTabularHistorianDataFailure = createAction(
  '[Tabular] Load Historian Data Failure',
  props<{ error: string }>()
);

// Load Chart Data Actions
export const loadTabularChartData = createAction(
  '[Tabular] Load Chart Data'
);

export const loadTabularChartDataSuccess = createAction(
  '[Tabular] Load Chart Data Success',
  props<{ data: any }>()
);

export const loadTabularChartDataFailure = createAction(
  '[Tabular] Load Chart Data Failure',
  props<{ error: string }>()
);

// Reset Tabular State
export const resetTabularState = createAction(
  '[Tabular] Reset State'
);
