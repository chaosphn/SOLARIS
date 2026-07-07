import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Contract } from './contract';

const routes: Routes = [
  {
    path: '',
    component: Contract
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContractRoutingModule { }
