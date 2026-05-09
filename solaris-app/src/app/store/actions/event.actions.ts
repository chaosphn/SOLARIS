import { createAction, props } from '@ngrx/store';
import { EventSummaryModel } from '../../features/sites/models/event.model';

export const setEventSummary = createAction(
  '[Event] Set Event Summary',
  props<{ payload: EventSummaryModel[] }>()
);

export const clearEventSummary = createAction(
  '[Event] Clear Event Summary'
);
