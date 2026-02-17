import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TabularRoutingModule } from './tabular-routing-module';
import { Tabular } from './tabular';
import { FormsModule } from '@angular/forms';
import { ShareModule } from '../../../../shared/shared.module';


@NgModule({
  declarations: [
    Tabular
  ],
  imports: [
    CommonModule,
    FormsModule,
    ShareModule,
    TabularRoutingModule
  ]
})
export class TabularModule { }
