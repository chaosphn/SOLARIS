import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RealtimeRoutingModule } from './realtime-routing-module';
import { Realtime } from './realtime';
import { ShareModule } from '../../../../shared/shared.module';


@NgModule({
  declarations: [
    Realtime
  ],
  imports: [
    CommonModule,
    ShareModule,
    RealtimeRoutingModule
  ]
})
export class RealtimeModule { }
