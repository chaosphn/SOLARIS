import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Tabular } from './tabular';

const routes: Routes = [
  {
    path: '',
    component: Tabular
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabularRoutingModule { }
