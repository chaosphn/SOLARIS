import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EnergyDeliveryReportRoutingModule } from './energy-delivery-report-routing-module';
import { EnergyDeliveryReport } from './energy-delivery-report';
import { ShareModule } from '../../../../shared/shared.module';

@NgModule({
  declarations: [
    EnergyDeliveryReport
  ],
  imports: [
    CommonModule,
    EnergyDeliveryReportRoutingModule,
    ShareModule
  ]
})
export class EnergyDeliveryReportModule { }
