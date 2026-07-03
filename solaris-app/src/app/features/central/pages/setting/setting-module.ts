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
import { PlantConfig } from './components/plant-config/plant-config';
import { PlantDialog } from './components/plant-dialog/plant-dialog';
import { PlantSlaConfig } from './components/plant-sla-config/plant-sla-config';
import { PlantSlaDialog } from './components/plant-sla-dialog/plant-sla-dialog';
import { PlantDiagramConfig } from './components/plant-diagram-config/plant-diagram-config';
import { PlantDiagramDialog } from './components/plant-diagram-dialog/plant-diagram-dialog';


@NgModule({
  declarations: [
    Setting,
    UserConfig,
    UserDialog,
    UserViewerDialog,
    AlarmConfig,
    EventDialog,
    NotificationConfig,
    PlantConfig,
    PlantDialog,
    PlantSlaConfig,
    PlantSlaDialog,
    PlantDiagramConfig,
    PlantDiagramDialog

  ],
  imports: [
    CommonModule,
    FormsModule,
    ShareModule,
    SettingRoutingModule,
  ]
})
export class SettingModule { }
