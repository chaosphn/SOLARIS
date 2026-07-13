import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EnergyDeliveryReport } from './energy-delivery-report';

const routes: Routes = [
  {
    path: '',
    component: EnergyDeliveryReport
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EnergyDeliveryReportRoutingModule { }
