import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OverviewRoutingModule } from './overview-routing-module';
import { Overview } from './overview';
import { ShareModule } from "../../../../shared/shared.module";
import { PowerConsumsion } from './component/power-consumsion/power-consumsion';
import { EnvironmentCard } from './component/environment-card/environment-card';
import { MapConsumption } from './component/map-consumption/map-consumption';
import { EnergyConsumption } from './component/energy-consumption/energy-consumption';
import { ChartModule } from "angular-highcharts";


@NgModule({
  declarations: [
    Overview,
    PowerConsumsion,
    EnvironmentCard,
    MapConsumption,
    EnergyConsumption
  ],
  imports: [
    CommonModule,
    OverviewRoutingModule,
    ShareModule,
    ChartModule
]
})
export class OverviewModule { }
