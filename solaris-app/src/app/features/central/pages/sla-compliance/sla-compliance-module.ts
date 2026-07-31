import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SlaComplianceRoutingModule } from './sla-compliance-routing-module';
import { SlaCompliance } from './sla-compliance';
import { ShareModule } from '../../../../shared/shared.module';
import { ChartsModule } from '../../../../shared/chart.module';

@NgModule({
  declarations: [
    SlaCompliance
  ],
  imports: [
    CommonModule,
    SlaComplianceRoutingModule,
    ShareModule,
    ChartsModule
  ]
})
export class SlaComplianceModule { }
