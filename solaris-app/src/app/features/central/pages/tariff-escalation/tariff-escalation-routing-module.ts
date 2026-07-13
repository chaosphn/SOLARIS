import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TariffEscalation } from './tariff-escalation';

const routes: Routes = [
  {
    path: '',
    component: TariffEscalation
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TariffEscalationRoutingModule { }
