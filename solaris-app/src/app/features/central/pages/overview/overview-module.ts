import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OverviewRoutingModule } from './overview-routing-module';
import { Overview } from './overview';
import { ShareModule } from "../../../../shared/shared.module";
import { PowerConsumsion } from './component/power-consumsion/power-consumsion';
import { EnvironmentCard } from './component/environment-card/environment-card';
import { MapConsumption } from './component/map-consumption/map-consumption';
import { EnergyConsumption } from './component/energy-consumption/energy-consumption';
import { ChartsModule } from '../../../../shared/chart.module';
import { SummaryCard } from './component/summary-card/summary-card';
import { FinancialSummary } from './component/financial-summary/financial-summary';


@NgModule({
  declarations: [
    Overview,
    PowerConsumsion,
    EnvironmentCard,
    MapConsumption,
    EnergyConsumption,
    SummaryCard,
    FinancialSummary
  ],
  imports: [
    CommonModule,
    OverviewRoutingModule,
    ShareModule,
    ChartsModule
]
})
export class OverviewModule { }
