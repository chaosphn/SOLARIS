import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportAdminRoutingModule } from './report-admin-routing-module';
import { ShareModule } from '../../../../shared/shared.module';
import { ReportAdmin } from './report-admin';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    ReportAdmin
  ],
  imports: [
    CommonModule,
    ShareModule,
    FormsModule,
    ReportAdminRoutingModule
  ]
})
export class ReportAdminModule { }
