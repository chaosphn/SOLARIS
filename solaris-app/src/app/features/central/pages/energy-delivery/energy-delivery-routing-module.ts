import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EnergyDelivery } from './energy-delivery';

const routes: Routes = [
  {
    path: '',
    component: EnergyDelivery
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EnergyDeliveryRoutingModule { }
