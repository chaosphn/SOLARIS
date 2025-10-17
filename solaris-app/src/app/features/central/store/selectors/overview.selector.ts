import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PageStateModel } from '../../../../shared/models/state.model';
import { overviewReducer } from '../reducers/overview.reducer';

// Feature selector
export const selectOverviewState = createFeatureSelector<PageStateModel>('overview');

// Config selectors
export const selectOverviewConfig = createSelector(
  selectOverviewState,
  (state: PageStateModel) => state.config
);

export const selectOverviewRealtimeConfig = createSelector(
  selectOverviewConfig,
  (config) => config.realtimeConfig
);

export const selectOverviewHistorianConfig = createSelector(
  selectOverviewConfig,
  (config) => config.historianConfig
);

export const selectOverviewChartConfig = createSelector(
  selectOverviewConfig,
  (config) => config.chartConfig
);

// Request selectors
export const selectOverviewRealtimeRequests = createSelector(
  selectOverviewState,
  (state: PageStateModel) => state.req_realtime
);

export const selectOverviewAtTimeRequests = createSelector(
  selectOverviewState,
  (state: PageStateModel) => state.req_attime
);

export const selectOverviewHistorianRequests = createSelector(
  selectOverviewState,
  (state: PageStateModel) => state.req_historian
);

// Data selectors
export const selectOverviewRealtimeData = createSelector(
  selectOverviewState,
  (state: PageStateModel) => state.data_realtime
);

export const selectOverviewHistorianData = createSelector(
  selectOverviewState,
  (state: PageStateModel) => state.data_historian
);

export const selectOverviewChartData = createSelector(
  selectOverviewState,
  (state: PageStateModel) => state.data_chart
);

// Specific data selectors
export const selectOverviewRealtimeDataByKey = (key: string) => createSelector(
  selectOverviewRealtimeData,
  (data) => data[key] || null
);

export const selectOverviewHistorianDataByKey = (key: string) => createSelector(
  selectOverviewHistorianData,
  (data) => data[key] || null
);

// Loading state selectors (you can add these if you implement loading states)
export const selectOverviewLoading = createSelector(
  selectOverviewState,
  (state: PageStateModel) => {
    // You can add loading flags to your state model if needed
    return false; // Placeholder
  }
);

// Error state selectors (you can add these if you implement error states)
export const selectOverviewError = createSelector(
  selectOverviewState,
  (state: PageStateModel) => {
    // You can add error flags to your state model if needed
    return null; // Placeholder
  }
);

// Timestamp selector
export const selectOverviewTimestamp = createSelector(
  selectOverviewState,
  (state: PageStateModel) => state.timestamp
);
