import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PageStateModel } from '../../../../shared/models/state.model';
import { trendReducer } from '../reducers/trend.reducer';

// Feature selector
export const selectTrendState = createFeatureSelector<PageStateModel>('trend');

// Config selectors
export const selectTrendConfig = createSelector(
  selectTrendState,
  (state: PageStateModel) => state.config
);

export const selectTrendRealtimeConfig = createSelector(
  selectTrendConfig,
  (config) => config.realtimeConfig
);

export const selectTrendHistorianConfig = createSelector(
  selectTrendConfig,
  (config) => config.historianConfig
);

export const selectTrendChartConfig = createSelector(
  selectTrendConfig,
  (config) => config.chartConfig
);

// Request selectors
export const selectTrendRealtimeRequests = createSelector(
  selectTrendState,
  (state: PageStateModel) => state.req_realtime
);

export const selectTrendAtTimeRequests = createSelector(
  selectTrendState,
  (state: PageStateModel) => state.req_attime
);

export const selectTrendHistorianRequests = createSelector(
  selectTrendState,
  (state: PageStateModel) => state.req_historian
);

// Data selectors
export const selectTrendRealtimeData = createSelector(
  selectTrendState,
  (state: PageStateModel) => state.data_realtime
);

export const selectTrendHistorianData = createSelector(
  selectTrendState,
  (state: PageStateModel) => state.data_historian
);

export const selectTrendChartData = createSelector(
  selectTrendState,
  (state: PageStateModel) => state.data_chart
);

// Specific data selectors
export const selectTrendRealtimeDataByKey = (key: string) => createSelector(
  selectTrendRealtimeData,
  (data) => data[key] || null
);

export const selectTrendHistorianDataByKey = (key: string) => createSelector(
  selectTrendHistorianData,
  (data) => data[key] || null
);

// Loading state selectors (you can add these if you implement loading states)
export const selectTrendLoading = createSelector(
  selectTrendState,
  (state: PageStateModel) => {
    // You can add loading flags to your state model if needed
    return false; // Placeholder
  }
);

// Error state selectors (you can add these if you implement error states)
export const selectTrendError = createSelector(
  selectTrendState,
  (state: PageStateModel) => {
    // You can add error flags to your state model if needed
    return null; // Placeholder
  }
);

// Timestamp selector
export const selectTrendTimestamp = createSelector(
  selectTrendState,
  (state: PageStateModel) => state.timestamp
);
