import { createAction, props } from '@ngrx/store';
import { ToastMessageOptions } from 'primeng/api';
import { ToastMessageModel } from '../../shared/models/toast.model';

export const sendMessage = createAction(
  '[Toaster] SendMsg',
  props<{ payload: ToastMessageModel }>()
);

