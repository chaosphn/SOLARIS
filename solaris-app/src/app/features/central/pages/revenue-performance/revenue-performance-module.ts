import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RevenuePerformanceRoutingModule } from './revenue-performance-routing-module';
import { RevenuePerformance } from './revenue-performance';
import { ShareModule } from '../../../../shared/shared.module';
import { ChartsModule } from '../../../../shared/chart.module';

@NgModule({
  declarations: [
    RevenuePerformance
  ],
  imports: [
    CommonModule,
    RevenuePerformanceRoutingModule,
    ShareModule,
    ChartsModule
  ]
})
export class RevenuePerformanceModule { }
