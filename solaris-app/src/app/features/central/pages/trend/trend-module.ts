import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TrendRoutingModule } from './trend-routing-module';
import { Trend } from './trend';


@NgModule({
  declarations: [
    Trend
  ],
  imports: [
    CommonModule,
    TrendRoutingModule
  ]
})
export class TrendModule { }
