import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Diagram } from './diagram';

const routes: Routes = [
  {
    path: '',
    component: Diagram
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DiagramRoutingModule { }
