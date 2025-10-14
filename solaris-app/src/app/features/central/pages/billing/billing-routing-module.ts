import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Billing } from './billing';

const routes: Routes = [
  {
    path: '',
    component: Billing
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BillingRoutingModule { }
