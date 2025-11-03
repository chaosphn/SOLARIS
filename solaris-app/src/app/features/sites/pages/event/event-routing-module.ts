import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Event } from './event';

const routes: Routes = [
  {
    path: '',
    component: Event
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EventRoutingModule { }
