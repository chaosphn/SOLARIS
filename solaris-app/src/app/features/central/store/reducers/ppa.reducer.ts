import { createReducer, on } from '@ngrx/store';
import { PpaStateModel } from '../../models/ppa-state.model';
import * as PpaActions from '../actions/ppa.action';

const initialState: PpaStateModel = {
  siteList: [],
  billingConfigs: [],
  slaData: {},
  realtimeData: {},
  monthlyEnergy: {},
  slaByYear: {},
  yearlyEnergy: {},
  slaHistoryTimestamp: null,
  timestamp: null
};

export const ppaReducer = createReducer(
  initialState,

  on(PpaActions.setPpaSiteList, (state, { siteList }) => ({ ...state, siteList })),
  on(PpaActions.setPpaBillingConfigs, (state, { billingConfigs }) => ({ ...state, billingConfigs })),
  on(PpaActions.setPpaSlaData, (state, { slaData }) => ({ ...state, slaData })),
  on(PpaActions.setPpaRealtimeData, (state, { realtimeData }) => ({ ...state, realtimeData })),
  on(PpaActions.setPpaMonthlyEnergy, (state, { monthlyEnergy }) => ({ ...state, monthlyEnergy })),
  on(PpaActions.setPpaSlaByYear, (state, { slaByYear }) => ({ ...state, slaByYear })),
  on(PpaActions.setPpaYearlyEnergy, (state, { yearlyEnergy }) => ({ ...state, yearlyEnergy })),
  on(PpaActions.setPpaSlaHistoryTimestamp, (state, { slaHistoryTimestamp }) => ({ ...state, slaHistoryTimestamp })),
  on(PpaActions.setPpaTimestamp, (state, { timestamp }) => ({ ...state, timestamp })),
  on(PpaActions.resetPpaState, () => initialState)
);
