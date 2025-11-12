import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfViewerModule } from 'ng2-pdf-viewer'
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
    PdfViewerModule,
    ReportsRoutingModule
  ]
})
export class ReportsModule { }
