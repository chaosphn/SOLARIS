import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PpaStateModel } from '../../models/ppa-state.model';

export const selectPpaState = createFeatureSelector<PpaStateModel>('ppa');

export const selectPpaSiteList = createSelector(selectPpaState, s => s.siteList);
export const selectPpaBillingConfigs = createSelector(selectPpaState, s => s.billingConfigs);
export const selectPpaSlaData = createSelector(selectPpaState, s => s.slaData);
export const selectPpaRealtimeData = createSelector(selectPpaState, s => s.realtimeData);
export const selectPpaMonthlyEnergy = createSelector(selectPpaState, s => s.monthlyEnergy);
export const selectPpaSlaByYear = createSelector(selectPpaState, s => s.slaByYear);
export const selectPpaYearlyEnergy = createSelector(selectPpaState, s => s.yearlyEnergy);
export const selectPpaSlaHistoryTimestamp = createSelector(selectPpaState, s => s.slaHistoryTimestamp);
export const selectPpaTimestamp = createSelector(selectPpaState, s => s.timestamp);
