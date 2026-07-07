import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RevenuePerformance } from './revenue-performance';

const routes: Routes = [
  {
    path: '',
    component: RevenuePerformance
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RevenuePerformanceRoutingModule { }
