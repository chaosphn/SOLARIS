import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TariffEscalationRoutingModule } from './tariff-escalation-routing-module';
import { TariffEscalation } from './tariff-escalation';
import { ShareModule } from '../../../../shared/shared.module';
import { ChartsModule } from '../../../../shared/chart.module';

@NgModule({
  declarations: [
    TariffEscalation
  ],
  imports: [
    CommonModule,
    TariffEscalationRoutingModule,
    ShareModule,
    ChartsModule
  ]
})
export class TariffEscalationModule { }
