import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Trend } from './trend';

const routes: Routes = [
  {
    path: '',
    component: Trend
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TrendRoutingModule { }
