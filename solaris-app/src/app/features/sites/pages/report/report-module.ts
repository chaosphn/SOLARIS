import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { ReportRoutingModule } from './report-routing-module';
import { ShareModule } from '../../../../shared/shared.module';
import { Report } from './report';


@NgModule({
  declarations: [
    Report
  ],
  imports: [
    CommonModule,
    ShareModule,
    PdfViewerModule,
    ReportRoutingModule
  ]
})
export class ReportModule { }
