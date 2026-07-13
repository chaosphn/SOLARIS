import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SlaCompliance } from './sla-compliance';

const routes: Routes = [
  {
    path: '',
    component: SlaCompliance
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SlaComplianceRoutingModule { }
