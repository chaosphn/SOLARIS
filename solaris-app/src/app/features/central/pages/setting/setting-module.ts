import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SettingRoutingModule } from './setting-routing-module';
import { Setting } from './setting';
import { UserDialog } from './components/user-dialog/user-dialog';
import { EventDialog } from './components/event-dialog/event-dialog';
import { ShareModule } from '../../../../shared/shared.module';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    Setting,
    UserDialog,
    EventDialog
  ],
  imports: [
    CommonModule,
    FormsModule,
    ShareModule,
    SettingRoutingModule
  ]
})
export class SettingModule { }
