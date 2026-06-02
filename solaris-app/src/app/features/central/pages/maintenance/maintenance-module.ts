import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HighchartsChartDirective } from 'highcharts-angular';
import { MaintenanceRoutingModule } from './maintenance-routing-module';
import { Maintenance } from './maintenance';
import { ShareModule } from '../../../../shared/shared.module';
import { ChartsModule } from '../../../../shared/chart.module';
import { WorkOrder } from './component/work-order/work-order';
import { Schedule } from './component/schedule/schedule';
import { History } from './component/history/history';
import { Overview } from './component/overview/overview';


@NgModule({
  declarations: [
    Maintenance,
    Overview,
    History,
    Schedule,
    WorkOrder
  ],
  imports: [
    CommonModule,
    ShareModule,
    ChartsModule,
    HighchartsChartDirective,
    MaintenanceRoutingModule
  ]
})
export class MaintenanceModule { }
