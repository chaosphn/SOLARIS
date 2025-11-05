import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BillingRoutingModule } from './billing-routing-module';
import { Billing } from './billing';
import { ShareModule } from '../../../../shared/shared.module';


@NgModule({
  declarations: [
    Billing
  ],
  imports: [
    CommonModule,
    ShareModule,

    BillingRoutingModule
  ]
})
export class BillingModule { }
