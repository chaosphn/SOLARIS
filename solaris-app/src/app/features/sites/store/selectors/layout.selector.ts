import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PageStateModel } from '../../../../shared/models/state.model';
import { layoutReducer } from '../reducers/layout.reducer';

// Feature selector
export const selectLayoutState = createFeatureSelector<PageStateModel>('layout');

// Config selectors
export const selectLayoutConfig = createSelector(
  selectLayoutState,
  (state: PageStateModel) => state.config
);

export const selectLayoutRealtimeConfig = createSelector(
  selectLayoutConfig,
  (config) => config.realtimeConfig
);

export const selectLayoutHistorianConfig = createSelector(
  selectLayoutConfig,
  (config) => config.historianConfig
);

export const selectLayoutChartConfig = createSelector(
  selectLayoutConfig,
  (config) => config.chartConfig
);

// Request selectors
export const selectLayoutRealtimeRequests = createSelector(
  selectLayoutState,
  (state: PageStateModel) => state.req_realtime
);

export const selectLayoutAtTimeRequests = createSelector(
  selectLayoutState,
  (state: PageStateModel) => state.req_attime
);

export const selectLayoutHistorianRequests = createSelector(
  selectLayoutState,
  (state: PageStateModel) => state.req_historian
);

// Data selectors
export const selectLayoutRealtimeData = createSelector(
  selectLayoutState,
  (state: PageStateModel) => state.data_realtime
);

export const selectLayoutHistorianData = createSelector(
  selectLayoutState,
  (state: PageStateModel) => state.data_historian
);

export const selectLayoutChartData = createSelector(
  selectLayoutState,
  (state: PageStateModel) => state.data_chart
);

// Specific data selectors
export const selectLayoutRealtimeDataByKey = (key: string) => createSelector(
  selectLayoutRealtimeData,
  (data) => data[key] || null
);

export const selectLayoutHistorianDataByKey = (key: string) => createSelector(
  selectLayoutHistorianData,
  (data) => data[key] || null
);

// Loading state selectors (you can add these if you implement loading states)
export const selectLayoutLoading = createSelector(
  selectLayoutState,
  (state: PageStateModel) => {
    // You can add loading flags to your state model if needed
    return false; // Placeholder
  }
);

// Error state selectors (you can add these if you implement error states)
export const selectLayoutError = createSelector(
  selectLayoutState,
  (state: PageStateModel) => {
    // You can add error flags to your state model if needed
    return null; // Placeholder
  }
);

// Timestamp selector
export const selectLayoutTimestamp = createSelector(
  selectLayoutState,
  (state: PageStateModel) => state.timestamp
);
