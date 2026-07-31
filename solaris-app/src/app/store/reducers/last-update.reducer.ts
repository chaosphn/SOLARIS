import { createReducer, on } from '@ngrx/store';
import { clearLastUpdate, setLastUpdate } from '../actions/last-update.actions';

export interface LastUpdateStateModel {
  timestamp: Date | null;
  intervalMs: number | null;
}

export const initialLastUpdateState: LastUpdateStateModel = {
  timestamp: null,
  intervalMs: null
};

export const lastUpdateReducer = createReducer(
  initialLastUpdateState,
  on(setLastUpdate, (_state, { payload }) => ({
    timestamp: payload.timestamp,
    intervalMs: payload.intervalMs ?? null
  })),
  on(clearLastUpdate, () => ({ ...initialLastUpdateState }))
);
