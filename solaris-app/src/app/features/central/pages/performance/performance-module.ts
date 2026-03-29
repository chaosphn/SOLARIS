import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PerformanceRoutingModule } from './performance-routing-module';
import { Performance } from './performance';
import { ShareModule } from '../../../../shared/shared.module';
import { ChartsModule } from '../../../../shared/chart.module';


@NgModule({
  declarations: [
    Performance
  ],
  imports: [
    CommonModule,
    ShareModule,
    ChartsModule,
    PerformanceRoutingModule
  ]
})
export class PerformanceModule { }
