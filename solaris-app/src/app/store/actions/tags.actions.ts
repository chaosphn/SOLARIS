import { createAction, props } from '@ngrx/store';
import { SiteStateModel } from '../../shared/models/config.model';
import { TagsStateModel } from '../../shared/models/tags.model';

export const setTags = createAction(
  '[Tags] SetTags',
  props<{ payload: TagsStateModel }>()
);

export const updateTags = createAction(
  '[Tags] UpdateTags',
  props<{ payload: TagsStateModel }>()
);

export const resetTags = createAction(
  '[Tags] ResetTags'
);

