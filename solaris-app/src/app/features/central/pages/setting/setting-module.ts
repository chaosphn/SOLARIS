import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SettingRoutingModule } from './setting-routing-module';
import { Setting } from './setting';
import { UserDialog } from './components/user-dialog/user-dialog';
import { EventDialog } from './components/event-dialog/event-dialog';
import { ShareModule } from '../../../../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { UserConfig } from './components/user-config/user-config';
import { AlarmConfig } from './components/alarm-config/alarm-config';
import { NotificationConfig } from './components/notification-config/notification-config';
import { UserViewerDialog } from './components/user-viewer-dialog/user-viewer-dialog';


@NgModule({
  declarations: [
    Setting,
    UserConfig,
    UserDialog,
    UserViewerDialog,
    AlarmConfig,
    EventDialog,
    NotificationConfig

  ],
  imports: [
    CommonModule,
    FormsModule,
    ShareModule,
    SettingRoutingModule,
  ]
})
export class SettingModule { }
