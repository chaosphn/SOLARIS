import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EventRoutingModule } from './event-routing-module';
import { ShareModule } from '../../../../shared/shared.module';
import { Event } from './event';


@NgModule({
  declarations: [
    Event
  ],
  imports: [
    CommonModule,
    ShareModule,
    EventRoutingModule
  ]
})
export class EventModule { }
