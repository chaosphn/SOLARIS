import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SlaComplianceRoutingModule } from './sla-compliance-routing-module';
import { SlaCompliance } from './sla-compliance';
import { ShareModule } from '../../../../shared/shared.module';

@NgModule({
  declarations: [
    SlaCompliance
  ],
  imports: [
    CommonModule,
    SlaComplianceRoutingModule,
    ShareModule
  ]
})
export class SlaComplianceModule { }
