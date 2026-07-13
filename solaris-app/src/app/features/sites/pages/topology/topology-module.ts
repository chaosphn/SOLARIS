import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfViewerModule } from 'ng2-pdf-viewer';

import { TopologyRoutingModule } from './topology-routing-module';
import { Topology } from './topology';
import { ShareModule } from '../../../../shared/shared.module';


@NgModule({
  declarations: [
    Topology
  ],
  imports: [
    ShareModule,
    CommonModule,
    PdfViewerModule,
    TopologyRoutingModule
  ]
})
export class TopologyModule { }
