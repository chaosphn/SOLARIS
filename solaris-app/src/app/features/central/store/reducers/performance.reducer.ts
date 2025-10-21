import { createReducer, on } from '@ngrx/store';
import { PageStateModel } from '../../../../shared/models/state.model';
import { PageConfigModel } from '../../../../shared/models/config.model';
import { GroupRequestAtTimeModel, GroupRequestHistorianModel, GroupRequestRealtimeModel } from '../../../../shared/models/request.model';
import { DataHistorianModel, DataRealtimeModel } from '../../../../shared/models/response.model';
import * as PerformanceActions from '../actions/performance.action';

// Initial state using PageStateModel structure
const initialState: PageStateModel = {
  config: {
    realtimeConfig: [],
    historianConfig: [],
    chartConfig: []
  } as PageConfigModel,
  req_realtime: [] as GroupRequestRealtimeModel[],
  req_attime: [] as GroupRequestAtTimeModel[],
  req_historian: [] as GroupRequestHistorianModel[],
  data_chart: null,
  data_realtime: {} as DataRealtimeModel,
  data_historian: {} as DataHistorianModel,
  timestamp: new Date()
};

export const performanceReducer = createReducer(
  initialState,

  // Timestamp Actions
  on(PerformanceActions.loadPerformanceConfigTimeStamp, (state, { timestamp }) => ({
    ...state,
    timestamp
  })),

  // Config Actions
  on(PerformanceActions.loadPerformanceConfigSuccess, (state, { config }) => ({
    ...state,
    config
  })),

  on(PerformanceActions.loadPerformanceConfigFailure, (state) => ({
    ...state,
    config: initialState.config
  })),

  // Realtime Data Actions
  on(PerformanceActions.loadPerformanceRealtimeData, (state, { requests }) => ({
    ...state,
    req_realtime: requests
  })),

  on(PerformanceActions.loadPerformanceRealtimeDataSuccess, (state, { data }) => ({
    ...state,
    data_realtime: data
  })),

  on(PerformanceActions.loadPerformanceRealtimeDataFailure, (state) => ({
    ...state,
    data_realtime: initialState.data_realtime
  })),

  // At Time Data Actions
  on(PerformanceActions.loadPerformanceAtTimeData, (state, { requests }) => ({
    ...state,
    req_attime: requests
  })),

  on(PerformanceActions.loadPerformanceAtTimeDataSuccess, (state, { data }) => ({
    ...state,
    data_realtime: { ...state.data_realtime, ...data }
  })),

  on(PerformanceActions.loadPerformanceAtTimeDataFailure, (state) => ({
    ...state
  })),

  // Historian Data Actions
  on(PerformanceActions.loadPerformanceHistorianData, (state, { requests }) => ({
    ...state,
    req_historian: requests
  })),

  on(PerformanceActions.loadPerformanceHistorianDataSuccess, (state, { data }) => ({
    ...state,
    data_historian: data
  })),

  on(PerformanceActions.loadPerformanceHistorianDataFailure, (state) => ({
    ...state,
    data_historian: initialState.data_historian
  })),

  // Chart Data Actions
  on(PerformanceActions.loadPerformanceChartDataSuccess, (state, { data }) => ({
    ...state,
    data_chart: data
  })),

  on(PerformanceActions.loadPerformanceChartDataFailure, (state) => ({
    ...state,
    data_chart: initialState.data_chart
  })),

  // Reset State
  on(PerformanceActions.resetPerformanceState, () => initialState)
);
