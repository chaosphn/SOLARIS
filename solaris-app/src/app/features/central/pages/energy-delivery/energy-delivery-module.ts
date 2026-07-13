import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EnergyDeliveryRoutingModule } from './energy-delivery-routing-module';
import { EnergyDelivery } from './energy-delivery';
import { ShareModule } from '../../../../shared/shared.module';
import { ChartsModule } from '../../../../shared/chart.module';

@NgModule({
  declarations: [
    EnergyDelivery
  ],
  imports: [
    CommonModule,
    EnergyDeliveryRoutingModule,
    ShareModule,
    ChartsModule
  ]
})
export class EnergyDeliveryModule { }
