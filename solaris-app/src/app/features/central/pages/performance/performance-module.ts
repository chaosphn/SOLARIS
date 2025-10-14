import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PerformanceRoutingModule } from './performance-routing-module';
import { Performance } from './performance';


@NgModule({
  declarations: [
    Performance
  ],
  imports: [
    CommonModule,
    PerformanceRoutingModule
  ]
})
export class PerformanceModule { }
