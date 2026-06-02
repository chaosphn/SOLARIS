import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Maintenance } from './maintenance';

const routes: Routes = [
  {
    path: '',
    component: Maintenance
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MaintenanceRoutingModule { }
