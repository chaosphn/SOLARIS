import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Performance } from './performance';

const routes: Routes = [
  {
      path: '',
      component: Performance
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PerformanceRoutingModule { }
