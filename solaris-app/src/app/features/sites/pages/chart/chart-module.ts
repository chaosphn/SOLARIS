import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChartRoutingModule } from './chart-routing-module';
import { Chart } from './chart';
import { ShareModule } from '../../../../shared/shared.module';


@NgModule({
  declarations: [
    Chart
  ],
  imports: [
    CommonModule,
    ShareModule,
    ChartRoutingModule
  ]
})
export class ChartModule { }
