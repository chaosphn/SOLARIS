import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ContractRoutingModule } from './contract-routing-module';
import { Contract } from './contract';
import { ShareModule } from '../../../../shared/shared.module';


@NgModule({
  declarations: [
    Contract
  ],
  imports: [
    CommonModule,
    ContractRoutingModule,
    ShareModule
  ]
})
export class ContractModule { }
