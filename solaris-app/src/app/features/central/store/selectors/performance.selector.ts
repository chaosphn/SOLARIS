import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PageStateModel } from '../../../../shared/models/state.model';
import { performanceReducer } from '../reducers/performance.reducer';

// Feature selector
export const selectPerformanceState = createFeatureSelector<PageStateModel>('performance');

// Config selectors
export const selectPerformanceConfig = createSelector(
  selectPerformanceState,
  (state: PageStateModel) => state.config
);

export const selectPerformanceRealtimeConfig = createSelector(
  selectPerformanceConfig,
  (config) => config.realtimeConfig
);

export const selectPerformanceHistorianConfig = createSelector(
  selectPerformanceConfig,
  (config) => config.historianConfig
);

export const selectPerformanceChartConfig = createSelector(
  selectPerformanceConfig,
  (config) => config.chartConfig
);

// Request selectors
export const selectPerformanceRealtimeRequests = createSelector(
  selectPerformanceState,
  (state: PageStateModel) => state.req_realtime
);

export const selectPerformanceAtTimeRequests = createSelector(
  selectPerformanceState,
  (state: PageStateModel) => state.req_attime
);

export const selectPerformanceHistorianRequests = createSelector(
  selectPerformanceState,
  (state: PageStateModel) => state.req_historian
);

// Data selectors
export const selectPerformanceRealtimeData = createSelector(
  selectPerformanceState,
  (state: PageStateModel) => state.data_realtime
);

export const selectPerformanceHistorianData = createSelector(
  selectPerformanceState,
  (state: PageStateModel) => state.data_historian
);

export const selectPerformanceChartData = createSelector(
  selectPerformanceState,
  (state: PageStateModel) => state.data_chart
);

// Specific data selectors
export const selectPerformanceRealtimeDataByKey = (key: string) => createSelector(
  selectPerformanceRealtimeData,
  (data) => data[key] || null
);

export const selectPerformanceHistorianDataByKey = (key: string) => createSelector(
  selectPerformanceHistorianData,
  (data) => data[key] || null
);

// Loading state selectors (you can add these if you implement loading states)
export const selectPerformanceLoading = createSelector(
  selectPerformanceState,
  (state: PageStateModel) => {
    // You can add loading flags to your state model if needed
    return false; // Placeholder
  }
);

// Error state selectors (you can add these if you implement error states)
export const selectPerformanceError = createSelector(
  selectPerformanceState,
  (state: PageStateModel) => {
    // You can add error flags to your state model if needed
    return null; // Placeholder
  }
);

// Timestamp selector
export const selectPerformanceTimestamp = createSelector(
  selectPerformanceState,
  (state: PageStateModel) => state.timestamp
);
