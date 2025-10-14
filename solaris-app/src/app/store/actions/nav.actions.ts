import { createAction, props } from '@ngrx/store';
import { NavbarStateModel } from '../../shared/models/navigate.model';


export const addState = createAction(
  '[Nav] AddState',
  props<{ payload: NavbarStateModel }>()
);