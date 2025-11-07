import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BillingRoutingModule } from './billing-routing-module';
import { Billing } from './billing';
import { ShareModule } from '../../../../shared/shared.module';
import { PdfViewerModule } from 'ng2-pdf-viewer';


@NgModule({
  declarations: [
    Billing
  ],
  imports: [
    CommonModule,
    ShareModule,
    PdfViewerModule,
    BillingRoutingModule
  ]
})
export class BillingModule { }
