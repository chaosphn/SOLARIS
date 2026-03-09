import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChartRoutingModule } from './chart-routing-module';
import { Chart } from './chart';
import { ShareModule } from '../../../../shared/shared.module';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    Chart
  ],
  imports: [
    CommonModule,
    FormsModule,
    ShareModule,
    ChartRoutingModule
  ]
})
export class ChartModule { }
