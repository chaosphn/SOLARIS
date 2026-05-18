import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Control } from './control';

const routes: Routes = [
  {
    path: '',
    component: Control
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ControlRoutingModule { }
