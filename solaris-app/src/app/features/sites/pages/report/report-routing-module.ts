import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Report } from './report';

const routes: Routes = [
  {
    path: '',
    component: Report
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportRoutingModule { }
