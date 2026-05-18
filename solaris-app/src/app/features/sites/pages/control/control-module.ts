import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ControlRoutingModule } from './control-routing-module';
import { ShareModule } from '../../../../shared/shared.module';
import { Control } from './control';


@NgModule({
  declarations: [
    Control
  ],
  imports: [
    CommonModule,
    FormsModule,
    ShareModule,
    ControlRoutingModule
  ]
})
export class ControlModule { }
