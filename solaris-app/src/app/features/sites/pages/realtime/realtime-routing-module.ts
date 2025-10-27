import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Realtime } from './realtime';

const routes: Routes = [
  {
    path: '',
    component: Realtime
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RealtimeRoutingModule { }
