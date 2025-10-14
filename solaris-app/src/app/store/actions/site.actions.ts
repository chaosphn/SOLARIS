import { createAction, props } from '@ngrx/store';
import { SiteStateModel } from '../../shared/models/config.model';

export const setSite = createAction(
  '[Site] SetSite',
  props<{ payload: SiteStateModel }>()
);


