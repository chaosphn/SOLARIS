import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PageStateModel } from '../../../../shared/models/state.model';
import { dashboardReducer } from '../reducers/dashboard.reducer';

// Feature selector
export const selectDashboardState = createFeatureSelector<PageStateModel>('dashboard');

// Config selectors
export const selectDashboardConfig = createSelector(
  selectDashboardState,
  (state: PageStateModel) => state.config
);

export const selectDashboardRealtimeConfig = createSelector(
  selectDashboardConfig,
  (config) => config.realtimeConfig
);

export const selectDashboardHistorianConfig = createSelector(
  selectDashboardConfig,
  (config) => config.historianConfig
);

export const selectDashboardChartConfig = createSelector(
  selectDashboardConfig,
  (config) => config.chartConfig
);

// Request selectors
export const selectDashboardRealtimeRequests = createSelector(
  selectDashboardState,
  (state: PageStateModel) => state.req_realtime
);

export const selectDashboardAtTimeRequests = createSelector(
  selectDashboardState,
  (state: PageStateModel) => state.req_attime
);

export const selectDashboardHistorianRequests = createSelector(
  selectDashboardState,
  (state: PageStateModel) => state.req_historian
);

// Data selectors
export const selectDashboardRealtimeData = createSelector(
  selectDashboardState,
  (state: PageStateModel) => state.data_realtime
);

export const selectDashboardHistorianData = createSelector(
  selectDashboardState,
  (state: PageStateModel) => state.data_historian
);

export const selectDashboardChartData = createSelector(
  selectDashboardState,
  (state: PageStateModel) => state.data_chart
);

// Specific data selectors
export const selectDashboardRealtimeDataByKey = (key: string) => createSelector(
  selectDashboardRealtimeData,
  (data) => data[key] || null
);

export const selectDashboardHistorianDataByKey = (key: string) => createSelector(
  selectDashboardHistorianData,
  (data) => data[key] || null
);

// Loading state selectors (you can add these if you implement loading states)
export const selectDashboardLoading = createSelector(
  selectDashboardState,
  (state: PageStateModel) => {
    // You can add loading flags to your state model if needed
    return false; // Placeholder
  }
);

// Error state selectors (you can add these if you implement error states)
export const selectDashboardError = createSelector(
  selectDashboardState,
  (state: PageStateModel) => {
    // You can add error flags to your state model if needed
    return null; // Placeholder
  }
);

// Timestamp selector
export const selectDashboardTimestamp = createSelector(
  selectDashboardState,
  (state: PageStateModel) => state.timestamp
);
