import { createAction, props } from '@ngrx/store';
import { PageConfigModel } from '../../../../shared/models/config.model';
import { GroupRequestAtTimeModel, GroupRequestHistorianModel, GroupRequestRealtimeModel } from '../../../../shared/models/request.model';
import { DataHistorianModel, DataRealtimeModel } from '../../../../shared/models/response.model';


// Load Overview Config Actions
export const loadTrendConfig = createAction(
  '[Trend] Load Config'
);

export const loadTrendConfigTimeStamp = createAction(
    '[Trend] Timestamp Load Config',
    props<{ timestamp: Date }>()
  );

export const loadTrendConfigSuccess = createAction(
  '[Trend] Load Config Success',
  props<{ config: PageConfigModel }>()
);

export const loadTrendConfigFailure = createAction(
  '[Trend] Load Config Failure',
  props<{ error: string }>()
);

// Load Realtime Data Actions
export const loadTrendRealtimeData = createAction(
  '[Trend] Load Realtime Data',
  props<{ requests: GroupRequestRealtimeModel[] }>()
);

export const loadTrendRealtimeDataSuccess = createAction(
  '[Trend] Load Realtime Data Success',
  props<{ data: DataRealtimeModel }>()
);

export const loadTrendRealtimeDataFailure = createAction(
  '[Trend] Load Realtime Data Failure',
  props<{ error: string }>()
);

// Load At Time Data Actions
export const loadTrendAtTimeData = createAction(
  '[Trend] Load At Time Data',
  props<{ requests: GroupRequestAtTimeModel[] }>()
);

export const loadTrendAtTimeDataSuccess = createAction(
  '[Trend] Load At Time Data Success',
  props<{ data: DataRealtimeModel }>()
);

export const loadTrendAtTimeDataFailure = createAction(
  '[Trend] Load At Time Data Failure',
  props<{ error: string }>()
);

// Load Historian Data Actions
export const loadTrendHistorianData = createAction(
  '[Trend] Load Historian Data',
  props<{ requests: GroupRequestHistorianModel[] }>()
);

export const loadTrendHistorianDataSuccess = createAction(
  '[Trend] Load Historian Data Success',
  props<{ data: DataHistorianModel }>()
);

export const loadTrendHistorianDataFailure = createAction(
  '[Trend] Load Historian Data Failure',
  props<{ error: string }>()
);

// Load Chart Data Actions
export const loadTrendChartData = createAction(
  '[Trend] Load Chart Data'
);

export const loadTrendChartDataSuccess = createAction(
  '[Trend] Load Chart Data Success',
  props<{ data: any }>()
);

export const loadTrendChartDataFailure = createAction(
  '[Trend] Load Chart Data Failure',
  props<{ error: string }>()
);

// Reset Trend State
export const resetTrendState = createAction(
  '[Trend] Reset State'
);
