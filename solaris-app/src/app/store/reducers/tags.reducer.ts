import { createReducer, on } from '@ngrx/store';
import { SiteStateModel } from '../../shared/models/config.model';
import { TagsStateModel } from '../../shared/models/tags.model';
import { setTags, updateTags } from '../actions/tags.actions';

export const initialSiteState: TagsStateModel = {
  name: '',
  tags: []
};

export const tagsReducer = createReducer(
  initialSiteState,
  on(setTags, (state, { payload }) => ({ ...payload })),
  on(updateTags, (state, { payload }) => ({ ...payload }))
);


