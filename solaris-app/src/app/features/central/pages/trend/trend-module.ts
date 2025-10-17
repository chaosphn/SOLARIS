import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TrendRoutingModule } from './trend-routing-module';
import { Trend } from './trend';
import { ShareModule } from '../../../../shared/shared.module';


@NgModule({
  declarations: [
    Trend
  ],
  imports: [
    CommonModule,
    TrendRoutingModule,
    ShareModule
  ]
})
export class TrendModule { }
