import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing-module';
import { ShareModule } from '../../../../shared/shared.module';
import { Dashboard } from './dashboard';
import { InfomationCard } from './component/infomation-card/infomation-card';
import { InverterSummary } from './component/inverter-summary/inverter-summary';
import { PowerConsumption } from './component/power-consumption/power-consumption';
import { WeatherStation } from './component/weather-station/weather-station';


@NgModule({
  declarations: [
    Dashboard,
    InfomationCard,
    InverterSummary,
    PowerConsumption,
    WeatherStation
  ],
  imports: [
    CommonModule,
    ShareModule,
    DashboardRoutingModule
  ]
})
export class DashboardModule { }
