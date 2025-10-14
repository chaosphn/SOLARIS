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



@NgModule({
  declarations: [
    FiltersitePipe,
    DatePickers
  ],
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    DatePickerModule
  ],
  exports: [
    FiltersitePipe,
    DatePickers
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