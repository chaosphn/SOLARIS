import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FinancialAnalysisRoutingModule } from './financial-analysis-routing-module';
import { FinancialAnalysis } from './financial-analysis';
import { ShareModule } from '../../../../shared/shared.module';

@NgModule({
  declarations: [
    FinancialAnalysis
  ],
  imports: [
    CommonModule,
    FinancialAnalysisRoutingModule,
    ShareModule
  ]
})
export class FinancialAnalysisModule { }
