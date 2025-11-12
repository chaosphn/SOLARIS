import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportAdmin } from './report-admin';

const routes: Routes = [
  {
    path: '',
    component: ReportAdmin
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportAdminRoutingModule { }
