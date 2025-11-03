import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PageStateModel } from '../../../../shared/models/state.model';
import { diagramReducer } from '../reducers/diagram.reducer';

// Feature selector
export const selectDiagramState = createFeatureSelector<PageStateModel>('diagram');

// Config selectors
export const selectDiagramConfig = createSelector(
  selectDiagramState,
  (state: PageStateModel) => state.config
);

export const selectDiagramRealtimeConfig = createSelector(
  selectDiagramConfig,
  (config) => config.realtimeConfig
);

export const selectDiagramHistorianConfig = createSelector(
  selectDiagramConfig,
  (config) => config.historianConfig
);

export const selectDiagramChartConfig = createSelector(
  selectDiagramConfig,
  (config) => config.chartConfig
);

// Request selectors
export const selectDiagramRealtimeRequests = createSelector(
  selectDiagramState,
  (state: PageStateModel) => state.req_realtime
);

export const selectDiagramAtTimeRequests = createSelector(
  selectDiagramState,
  (state: PageStateModel) => state.req_attime
);

export const selectDiagramHistorianRequests = createSelector(
  selectDiagramState,
  (state: PageStateModel) => state.req_historian
);

// Data selectors
export const selectDiagramRealtimeData = createSelector(
  selectDiagramState,
  (state: PageStateModel) => state.data_realtime
);

export const selectDiagramHistorianData = createSelector(
  selectDiagramState,
  (state: PageStateModel) => state.data_historian
);

export const selectDiagramChartData = createSelector(
  selectDiagramState,
  (state: PageStateModel) => state.data_chart
);

// Specific data selectors
export const selectDiagramRealtimeDataByKey = (key: string) => createSelector(
  selectDiagramRealtimeData,
  (data) => data[key] || null
);

export const selectDiagramHistorianDataByKey = (key: string) => createSelector(
  selectDiagramHistorianData,
  (data) => data[key] || null
);

// Loading state selectors (you can add these if you implement loading states)
export const selectDiagramLoading = createSelector(
  selectDiagramState,
  (state: PageStateModel) => {
    // You can add loading flags to your state model if needed
    return false; // Placeholder
  }
);

// Error state selectors (you can add these if you implement error states)
export const selectDiagramError = createSelector(
  selectDiagramState,
  (state: PageStateModel) => {
    // You can add error flags to your state model if needed
    return null; // Placeholder
  }
);

// Timestamp selector
export const selectDiagramTimestamp = createSelector(
  selectDiagramState,
  (state: PageStateModel) => state.timestamp
);
