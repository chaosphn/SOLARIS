import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EventRoutingModule } from './event-routing-module';
import { ShareModule } from '../../../../shared/shared.module';
import { Events } from './event';
import { EventDetails } from './components/event-details/event-details';
import { EventConsumption } from './components/event-consumption/event-consumption';


@NgModule({
  declarations: [
    Events,
    EventDetails,
    EventConsumption
  ],
  imports: [
    CommonModule,
    ShareModule,
    EventRoutingModule
  ]
})
export class EventModule { }
