import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PerformanceRoutingModule } from './performance-routing-module';
import { Performance } from './performance';
import { ShareModule } from '../../../../shared/shared.module';


@NgModule({
  declarations: [
    Performance
  ],
  imports: [
    CommonModule,
    ShareModule,
    PerformanceRoutingModule
  ]
})
export class PerformanceModule { }
