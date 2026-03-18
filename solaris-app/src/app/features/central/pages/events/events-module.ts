import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Events2RoutingModule } from './events-routing-module';
import { Events2 } from './events';
import { EventDetails } from './components/event-details/event-details';
import { EventConsumption } from './components/event-consumption/event-consumption';
import { ShareModule } from '../../../../shared/shared.module';


@NgModule({
  declarations: [
    Events2,
    EventDetails,
    EventConsumption
  ],
  imports: [
    CommonModule,
    ShareModule,
    Events2RoutingModule
  ]
})
export class Events2Module { }
