import { createAction, props } from '@ngrx/store';
import { PageConfigModel } from '../../../../shared/models/config.model';
import { GroupRequestAtTimeModel, GroupRequestHistorianModel, GroupRequestRealtimeModel } from '../../../../shared/models/request.model';
import { DataHistorianModel, DataRealtimeModel } from '../../../../shared/models/response.model';


// Load Diagram Config Actions
export const loadDiagramConfig = createAction(
  '[Diagram] Load Config'
);

export const loadDiagramConfigTimeStamp = createAction(
    '[Diagram] Timestamp Load Config',
    props<{ timestamp: Date }>()
  );

export const loadDiagramConfigSuccess = createAction(
  '[Diagram] Load Config Success',
  props<{ config: PageConfigModel }>()
);

export const loadDiagramConfigFailure = createAction(
  '[Diagram] Load Config Failure',
  props<{ error: string }>()
);

// Load Realtime Data Actions
export const loadDiagramRealtimeData = createAction(
  '[Diagram] Load Realtime Data',
  props<{ requests: GroupRequestRealtimeModel[] }>()
);

export const loadDiagramRealtimeDataSuccess = createAction(
  '[Diagram] Load Realtime Data Success',
  props<{ data: DataRealtimeModel }>()
);

export const loadDiagramRealtimeDataFailure = createAction(
  '[Diagram] Load Realtime Data Failure',
  props<{ error: string }>()
);

// Load At Time Data Actions
export const loadDiagramAtTimeData = createAction(
  '[Diagram] Load At Time Data',
  props<{ requests: GroupRequestAtTimeModel[] }>()
);

export const loadDiagramAtTimeDataSuccess = createAction(
  '[Diagram] Load At Time Data Success',
  props<{ data: DataRealtimeModel }>()
);

export const loadDiagramAtTimeDataFailure = createAction(
  '[Diagram] Load At Time Data Failure',
  props<{ error: string }>()
);

// Load Historian Data Actions
export const loadDiagramHistorianData = createAction(
  '[Diagram] Load Historian Data',
  props<{ requests: GroupRequestHistorianModel[] }>()
);

export const loadDiagramHistorianDataSuccess = createAction(
  '[Diagram] Load Historian Data Success',
  props<{ data: DataHistorianModel }>()
);

export const loadDiagramHistorianDataFailure = createAction(
  '[Diagram] Load Historian Data Failure',
  props<{ error: string }>()
);

// Load Chart Data Actions
export const loadDiagramChartData = createAction(
  '[Diagram] Load Chart Data'
);

export const loadDiagramChartDataSuccess = createAction(
  '[Diagram] Load Chart Data Success',
  props<{ data: any }>()
);

export const loadDiagramChartDataFailure = createAction(
  '[Diagram] Load Chart Data Failure',
  props<{ error: string }>()
);

// Reset Diagram State
export const resetDiagramState = createAction(
  '[Diagram] Reset State'
);
