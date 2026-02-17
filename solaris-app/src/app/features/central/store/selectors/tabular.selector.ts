import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PageStateModel } from '../../../../shared/models/state.model';
import { tabularReducer } from '../reducers/tabular.reducer';

// Feature selector
export const selectTabularState = createFeatureSelector<PageStateModel>('tabular');

// Config selectors
export const selectTabularConfig = createSelector(
  selectTabularState,
  (state: PageStateModel) => state.config
);

export const selectTabularRealtimeConfig = createSelector(
  selectTabularConfig,
  (config) => config.realtimeConfig
);

export const selectTabularHistorianConfig = createSelector(
  selectTabularConfig,
  (config) => config.historianConfig
);

export const selectTabularChartConfig = createSelector(
  selectTabularConfig,
  (config) => config.chartConfig
);

// Request selectors
export const selectTabularRealtimeRequests = createSelector(
  selectTabularState,
  (state: PageStateModel) => state.req_realtime
);

export const selectTabularAtTimeRequests = createSelector(
  selectTabularState,
  (state: PageStateModel) => state.req_attime
);

export const selectTabularHistorianRequests = createSelector(
  selectTabularState,
  (state: PageStateModel) => state.req_historian
);

// Data selectors
export const selectTabularRealtimeData = createSelector(
  selectTabularState,
  (state: PageStateModel) => state.data_realtime
);

export const selectTabularHistorianData = createSelector(
  selectTabularState,
  (state: PageStateModel) => state.data_historian
);

export const selectTabularChartData = createSelector(
  selectTabularState,
  (state: PageStateModel) => state.data_chart
);

// Specific data selectors
export const selectTabularRealtimeDataByKey = (key: string) => createSelector(
  selectTabularRealtimeData,
  (data) => data[key] || null
);

export const selectTabularHistorianDataByKey = (key: string) => createSelector(
  selectTabularHistorianData,
  (data) => data[key] || null
);

// Loading state selectors (you can add these if you implement loading states)
export const selectTabularLoading = createSelector(
  selectTabularState,
  (state: PageStateModel) => {
    // You can add loading flags to your state model if needed
    return false; // Placeholder
  }
);

// Error state selectors (you can add these if you implement error states)
export const selectTabularError = createSelector(
  selectTabularState,
  (state: PageStateModel) => {
    // You can add error flags to your state model if needed
    return null; // Placeholder
  }
);

// Timestamp selector
export const selectTabularTimestamp = createSelector(
  selectTabularState,
  (state: PageStateModel) => state.timestamp
);
