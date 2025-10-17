import { createAction, props } from '@ngrx/store';

export const setDate = createAction(
  '[Date] SetDate',
  props<{ payload: Date }>()
);

export const setDateEnable = createAction(
  '[Date] SetDateEnable',
  props<{ payload: boolean }>()
);
