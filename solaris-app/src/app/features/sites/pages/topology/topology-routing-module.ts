import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Topology } from './topology';

const routes: Routes = [
  {
    path: '',
    component: Topology
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TopologyRoutingModule { }
