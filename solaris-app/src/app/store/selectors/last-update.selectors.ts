import { createFeatureSelector, createSelector } from '@ngrx/store';
import { LastUpdateStateModel } from '../reducers/last-update.reducer';

export const selectLastUpdateState = createFeatureSelector<LastUpdateStateModel>('lastUpdate');

export const getLastUpdateState = createSelector(
  selectLastUpdateState,
  (state: LastUpdateStateModel) => state
);
