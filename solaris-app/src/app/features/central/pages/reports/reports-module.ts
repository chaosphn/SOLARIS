import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportsRoutingModule } from './reports-routing-module';
import { ShareModule } from '../../../../shared/shared.module';
import { Reports } from './reports';


@NgModule({
  declarations: [
    Reports
  ],
  imports: [
    CommonModule,
    ShareModule,
    ReportsRoutingModule
  ]
})
export class ReportsModule { }
