import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FinancialAnalysis } from './financial-analysis';

const routes: Routes = [
  {
    path: '',
    component: FinancialAnalysis
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FinancialAnalysisRoutingModule { }
