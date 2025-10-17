import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FiltersitePipe } from './pipes/filtersite-pipe';
import { MaterialModule } from '../core/module/material-module';
import { DatePicker, DatePickerModule } from 'primeng/datepicker';
import { DatePickers } from './components/date-picker/date-picker';
import { FormsModule } from '@angular/forms';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { CardContainer } from './components/card-container/card-container';
import { CircleProgress } from './components/circle-progress/circle-progress';
import { PolygonCard } from './components/polygon-card/polygon-card';
import { StackChart } from './components/stack-chart/stack-chart';
import { Piechart } from './components/piechart/piechart';
import { ChartModule } from 'angular-highcharts';
import { Highchart } from './components/highchart/highchart';



@NgModule({
  declarations: [
    FiltersitePipe,

    DatePickers,
    CardContainer,
    CircleProgress,
    PolygonCard,
    StackChart,
    Piechart,
    Highchart
  ],
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    DatePickerModule,
    ChartModule
  ],
  exports: [
    MaterialModule,

    FiltersitePipe,

    DatePickers,
    CardContainer,
    CircleProgress,
    PolygonCard,
    StackChart,
    Piechart,
    Highchart
    
  ],
  providers: [
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura
      }
    })
  ]
})
export class ShareModule { }