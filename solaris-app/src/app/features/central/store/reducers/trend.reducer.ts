import { createReducer, on } from '@ngrx/store';
import { PageStateModel } from '../../../../shared/models/state.model';
import { PageConfigModel } from '../../../../shared/models/config.model';
import { GroupRequestAtTimeModel, GroupRequestHistorianModel, GroupRequestRealtimeModel } from '../../../../shared/models/request.model';
import { DataHistorianModel, DataRealtimeModel } from '../../../../shared/models/response.model';
import * as TrendActions from '../actions/trend.action';

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

export const trendReducer = createReducer(
  initialState,

  // Timestamp Actions
  on(TrendActions.loadTrendConfigTimeStamp, (state, { timestamp }) => ({
    ...state,
    timestamp
  })),

  // Config Actions
  on(TrendActions.loadTrendConfigSuccess, (state, { config }) => ({
    ...state,
    config
  })),

  on(TrendActions.loadTrendConfigFailure, (state) => ({
    ...state,
    config: initialState.config
  })),

  // Realtime Data Actions
  on(TrendActions.loadTrendRealtimeData, (state, { requests }) => ({
    ...state,
    req_realtime: requests
  })),

  on(TrendActions.loadTrendRealtimeDataSuccess, (state, { data }) => ({
    ...state,
    data_realtime: data
  })),

  on(TrendActions.loadTrendRealtimeDataFailure, (state) => ({
    ...state,
    data_realtime: initialState.data_realtime
  })),

  // At Time Data Actions
  on(TrendActions.loadTrendAtTimeData, (state, { requests }) => ({
    ...state,
    req_attime: requests
  })),

  on(TrendActions.loadTrendAtTimeDataSuccess, (state, { data }) => ({
    ...state,
    data_realtime: { ...state.data_realtime, ...data }
  })),

  on(TrendActions.loadTrendAtTimeDataFailure, (state) => ({
    ...state
  })),

  // Historian Data Actions
  on(TrendActions.loadTrendHistorianData, (state, { requests }) => ({
    ...state,
    req_historian: requests
  })),

  on(TrendActions.loadTrendHistorianDataSuccess, (state, { data }) => ({
    ...state,
    data_historian: data
  })),

  on(TrendActions.loadTrendHistorianDataFailure, (state) => ({
    ...state,
    data_historian: initialState.data_historian
  })),

  // Chart Data Actions
  on(TrendActions.loadTrendChartDataSuccess, (state, { data }) => ({
    ...state,
    data_chart: data
  })),

  on(TrendActions.loadTrendChartDataFailure, (state) => ({
    ...state,
    data_chart: initialState.data_chart
  })),

  // Reset State
  on(TrendActions.resetTrendState, () => initialState)
);
