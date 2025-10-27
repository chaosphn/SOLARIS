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
import { PanelLayout } from './components/panel-layout/panel-layout';
import { ChartCard } from './components/chart-card/chart-card';
import { OwlDateTimeModule, OWL_DATE_TIME_FORMATS, OwlNativeDateTimeModule } from '@danielmoncada/angular-datetime-picker';
import { OwlMomentDateTimeModule } from '@danielmoncada/angular-datetime-picker-moment-adapter';
import { TimeSelectComponent } from './components/time-select/time-select.component';
import { MAT_DATE_LOCALE, MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS, provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { NumberFomatPipe } from './pipes/number-fomat.pipe';
import { FilterTable } from './components/filter-table/filter-table';

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthLabel: 'MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};


@NgModule({
  declarations: [
    FiltersitePipe,
    NumberFomatPipe,

    DatePickers,
    CardContainer,
    CircleProgress,
    PolygonCard,
    StackChart,
    Piechart,
    Highchart,
    PanelLayout,
    ChartCard,
    TimeSelectComponent,
    FilterTable
  ],
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    DatePickerModule,
    ChartModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
  ],
  exports: [
    MaterialModule,

    FiltersitePipe,
    NumberFomatPipe,

    DatePickers,
    CardContainer,
    CircleProgress,
    PolygonCard,
    StackChart,
    Piechart,
    Highchart,
    PanelLayout,
    ChartCard,
    TimeSelectComponent,
    FilterTable
    
  ],
  providers: [
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
      },
    }),
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
    },
    {
      provide: MAT_DATE_FORMATS,
      useFactory: () => ({
        parse: { dateInput: 'DD/MM/YYYY' },
        display: {
          dateInput: 'DD/MM/YYYY',
          monthYearLabel: 'MMM YYYY',
          dateA11yLabel: 'LL',
          monthYearA11yLabel: 'MMMM YYYY',
        }
      })
    }
  ]
})
export class ShareModule { }