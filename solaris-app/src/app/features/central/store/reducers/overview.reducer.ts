import { createReducer, on } from '@ngrx/store';
import { PageStateModel } from '../../../../shared/models/state.model';
import { PageConfigModel } from '../../../../shared/models/config.model';
import { GroupRequestAtTimeModel, GroupRequestHistorianModel, GroupRequestRealtimeModel } from '../../../../shared/models/request.model';
import { DataHistorianModel, DataRealtimeModel } from '../../../../shared/models/response.model';
import * as OverviewActions from '../actions/overview.action';

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

export const overviewReducer = createReducer(
  initialState,

  // Timestamp Actions
  on(OverviewActions.loadOverviewConfigTimeStamp, (state, { timestamp }) => ({
    ...state,
    timestamp
  })),

  // Config Actions
  on(OverviewActions.loadOverviewConfigSuccess, (state, { config }) => ({
    ...state,
    config
  })),

  on(OverviewActions.loadOverviewConfigFailure, (state) => ({
    ...state,
    config: initialState.config
  })),

  // Realtime Data Actions
  on(OverviewActions.loadOverviewRealtimeData, (state, { requests }) => ({
    ...state,
    req_realtime: requests
  })),

  on(OverviewActions.loadOverviewRealtimeDataSuccess, (state, { data }) => ({
    ...state,
    data_realtime: data
  })),

  on(OverviewActions.loadOverviewRealtimeDataFailure, (state) => ({
    ...state,
    data_realtime: initialState.data_realtime
  })),

  // At Time Data Actions
  on(OverviewActions.loadOverviewAtTimeData, (state, { requests }) => ({
    ...state,
    req_attime: requests
  })),

  on(OverviewActions.loadOverviewAtTimeDataSuccess, (state, { data }) => ({
    ...state,
    data_realtime: { ...state.data_realtime, ...data }
  })),

  on(OverviewActions.loadOverviewAtTimeDataFailure, (state) => ({
    ...state
  })),

  // Historian Data Actions
  on(OverviewActions.loadOverviewHistorianData, (state, { requests }) => ({
    ...state,
    req_historian: requests
  })),

  on(OverviewActions.loadOverviewHistorianDataSuccess, (state, { data }) => ({
    ...state,
    data_historian: data
  })),

  on(OverviewActions.loadOverviewHistorianDataFailure, (state) => ({
    ...state,
    data_historian: initialState.data_historian
  })),

  // Chart Data Actions
  on(OverviewActions.loadOverviewChartDataSuccess, (state, { data }) => ({
    ...state,
    data_chart: data
  })),

  on(OverviewActions.loadOverviewChartDataFailure, (state) => ({
    ...state,
    data_chart: initialState.data_chart
  })),

  // Reset State
  on(OverviewActions.resetOverviewState, () => initialState)
);
