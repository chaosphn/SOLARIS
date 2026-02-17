import { createReducer, on } from '@ngrx/store';
import { PageStateModel } from '../../../../shared/models/state.model';
import { PageConfigModel } from '../../../../shared/models/config.model';
import { GroupRequestAtTimeModel, GroupRequestHistorianModel, GroupRequestRealtimeModel } from '../../../../shared/models/request.model';
import { DataHistorianModel, DataRealtimeModel } from '../../../../shared/models/response.model';
import * as TabularActions from '../actions/tabular.action';

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

export const tabularReducer = createReducer(
  initialState,

  // Timestamp Actions
  on(TabularActions.loadTabularConfigTimeStamp, (state, { timestamp }) => ({
    ...state,
    timestamp
  })),

  // Config Actions
  on(TabularActions.loadTabularConfigSuccess, (state, { config }) => ({
    ...state,
    config
  })),

  on(TabularActions.loadTabularConfigFailure, (state) => ({
    ...state,
    config: initialState.config
  })),

  // Realtime Data Actions
  on(TabularActions.loadTabularRealtimeData, (state, { requests }) => ({
    ...state,
    req_realtime: requests
  })),

  on(TabularActions.loadTabularRealtimeDataSuccess, (state, { data }) => ({
    ...state,
    data_realtime: data
  })),

  on(TabularActions.loadTabularRealtimeDataFailure, (state) => ({
    ...state,
    data_realtime: initialState.data_realtime
  })),

  // At Time Data Actions
  on(TabularActions.loadTabularAtTimeData, (state, { requests }) => ({
    ...state,
    req_attime: requests
  })),

  on(TabularActions.loadTabularAtTimeDataSuccess, (state, { data }) => ({
    ...state,
    data_realtime: { ...state.data_realtime, ...data }
  })),

  on(TabularActions.loadTabularAtTimeDataFailure, (state) => ({
    ...state
  })),

  // Historian Data Actions
  on(TabularActions.loadTabularHistorianData, (state, { requests }) => ({
    ...state,
    req_historian: requests
  })),

  on(TabularActions.loadTabularHistorianDataSuccess, (state, { data }) => ({
    ...state,
    data_historian: data
  })),

  on(TabularActions.loadTabularHistorianDataFailure, (state) => ({
    ...state,
    data_historian: initialState.data_historian
  })),

  // Chart Data Actions
  on(TabularActions.loadTabularChartDataSuccess, (state, { data }) => ({
    ...state,
    data_chart: data
  })),

  on(TabularActions.loadTabularChartDataFailure, (state) => ({
    ...state,
    data_chart: initialState.data_chart
  })),

  // Reset State
  on(TabularActions.resetTabularState, () => initialState)
);
