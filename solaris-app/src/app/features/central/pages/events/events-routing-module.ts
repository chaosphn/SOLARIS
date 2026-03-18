import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Events2 } from './events';

const routes: Routes = [
  {
    path: '',
    component: Events2
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Events2RoutingModule { }
