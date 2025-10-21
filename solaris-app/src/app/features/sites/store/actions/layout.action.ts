import { createAction, props } from '@ngrx/store';
import { PageConfigModel } from '../../../../shared/models/config.model';
import { GroupRequestAtTimeModel, GroupRequestHistorianModel, GroupRequestRealtimeModel } from '../../../../shared/models/request.model';
import { DataHistorianModel, DataRealtimeModel } from '../../../../shared/models/response.model';


// Load Layout Config Actions
export const loadLayoutConfig = createAction(
  '[Layout] Load Config'
);

export const loadLayoutConfigTimeStamp = createAction(
    '[Layout] Timestamp Load Config',
    props<{ timestamp: Date }>()
  );

export const loadLayoutConfigSuccess = createAction(
  '[Layout] Load Config Success',
  props<{ config: PageConfigModel }>()
);

export const loadLayoutConfigFailure = createAction(
  '[Layout] Load Config Failure',
  props<{ error: string }>()
);

// Load Realtime Data Actions
export const loadLayoutRealtimeData = createAction(
  '[Layout] Load Realtime Data',
  props<{ requests: GroupRequestRealtimeModel[] }>()
);

export const loadLayoutRealtimeDataSuccess = createAction(
  '[Layout] Load Realtime Data Success',
  props<{ data: DataRealtimeModel }>()
);

export const loadLayoutRealtimeDataFailure = createAction(
  '[Layout] Load Realtime Data Failure',
  props<{ error: string }>()
);

// Load At Time Data Actions
export const loadLayoutAtTimeData = createAction(
  '[Layout] Load At Time Data',
  props<{ requests: GroupRequestAtTimeModel[] }>()
);

export const loadLayoutAtTimeDataSuccess = createAction(
  '[Layout] Load At Time Data Success',
  props<{ data: DataRealtimeModel }>()
);

export const loadLayoutAtTimeDataFailure = createAction(
  '[Layout] Load At Time Data Failure',
  props<{ error: string }>()
);

// Load Historian Data Actions
export const loadLayoutHistorianData = createAction(
  '[Layout] Load Historian Data',
  props<{ requests: GroupRequestHistorianModel[] }>()
);

export const loadLayoutHistorianDataSuccess = createAction(
  '[Layout] Load Historian Data Success',
  props<{ data: DataHistorianModel }>()
);

export const loadLayoutHistorianDataFailure = createAction(
  '[Layout] Load Historian Data Failure',
  props<{ error: string }>()
);

// Load Chart Data Actions
export const loadLayoutChartData = createAction(
  '[Layout] Load Chart Data'
);

export const loadLayoutChartDataSuccess = createAction(
  '[Layout] Load Chart Data Success',
  props<{ data: any }>()
);

export const loadLayoutChartDataFailure = createAction(
  '[Layout] Load Chart Data Failure',
  props<{ error: string }>()
);

// Reset Layout State
export const resetLayoutState = createAction(
  '[Layout] Reset State'
);
