import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PageStateModel } from '../../../../shared/models/state.model';
import { efficiencyReducer } from '../reducers/performance.reducer';

// Feature selector
export const selectEfficiencyState = createFeatureSelector<PageStateModel>('efficiency');

// Config selectors
export const selectEfficiencyConfig = createSelector(
  selectEfficiencyState,
  (state: PageStateModel) => state.config
);

export const selectEfficiencyRealtimeConfig = createSelector(
  selectEfficiencyConfig,
  (config) => config.realtimeConfig
);

export const selectEfficiencyHistorianConfig = createSelector(
  selectEfficiencyConfig,
  (config) => config.historianConfig
);

export const selectEfficiencyChartConfig = createSelector(
  selectEfficiencyConfig,
  (config) => config.chartConfig
);

// Request selectors
export const selectEfficiencyRealtimeRequests = createSelector(
  selectEfficiencyState,
  (state: PageStateModel) => state.req_realtime
);

export const selectEfficiencyAtTimeRequests = createSelector(
  selectEfficiencyState,
  (state: PageStateModel) => state.req_attime
);

export const selectEfficiencyHistorianRequests = createSelector(
  selectEfficiencyState,
  (state: PageStateModel) => state.req_historian
);

// Data selectors
export const selectEfficiencyRealtimeData = createSelector(
  selectEfficiencyState,
  (state: PageStateModel) => state.data_realtime
);

export const selectEfficiencyHistorianData = createSelector(
  selectEfficiencyState,
  (state: PageStateModel) => state.data_historian
);

export const selectEfficiencyChartData = createSelector(
  selectEfficiencyState,
  (state: PageStateModel) => state.data_chart
);

// Specific data selectors
export const selectEfficiencyRealtimeDataByKey = (key: string) => createSelector(
  selectEfficiencyRealtimeData,
  (data) => data[key] || null
);

export const selectEfficiencyHistorianDataByKey = (key: string) => createSelector(
  selectEfficiencyHistorianData,
  (data) => data[key] || null
);

// Loading state selectors (you can add these if you implement loading states)
export const selectEfficiencyLoading = createSelector(
  selectEfficiencyState,
  (state: PageStateModel) => {
    // You can add loading flags to your state model if needed
    return false; // Placeholder
  }
);

// Error state selectors (you can add these if you implement error states)
export const selectEfficiencyError = createSelector(
  selectEfficiencyState,
  (state: PageStateModel) => {
    // You can add error flags to your state model if needed
    return null; // Placeholder
  }
);

// Timestamp selector
export const selectEfficiencyTimestamp = createSelector(
  selectEfficiencyState,
  (state: PageStateModel) => state.timestamp
);
