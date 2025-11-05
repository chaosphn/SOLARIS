import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing-module';
import { Admin } from './admin';
import { ShareModule } from '../../../../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { ConfigDialog } from './components/config-dialog/config-dialog';


@NgModule({
  declarations: [
    Admin,
    ConfigDialog
  ],
  imports: [
    CommonModule,
    ShareModule,
    FormsModule,
    AdminRoutingModule
  ]
})
export class AdminModule { }
