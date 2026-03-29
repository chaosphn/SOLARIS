import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LayoutRoutingModule } from './layout-routing-module';
import { Layout } from './layout';
import { ShareModule } from '../../../../shared/shared.module';
import { EnvironmentCard } from './component/environment-card/environment-card';
import { PowerConsumption } from './component/power-consumption/power-consumption';
import { ChartsModule } from '../../../../shared/chart.module';


@NgModule({
  declarations: [
    Layout,
    EnvironmentCard,
    PowerConsumption
  ],
  imports: [
    CommonModule,
    ShareModule,
    ChartsModule,
    LayoutRoutingModule
  ]
})
export class LayoutModule { }
