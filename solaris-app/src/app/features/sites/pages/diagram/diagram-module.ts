import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DiagramRoutingModule } from './diagram-routing-module';
import { Diagram } from './diagram';
import { ShareModule } from '../../../../shared/shared.module';


@NgModule({
  declarations: [
    Diagram
  ],
  imports: [
    CommonModule,
    ShareModule,
    DiagramRoutingModule
  ]
})
export class DiagramModule { }
