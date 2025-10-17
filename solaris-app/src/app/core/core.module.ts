import { NgModule, Optional, SkipSelf } from '@angular/core';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Login } from './components/login/login';
import { Navbar } from './components/navbar/navbar';
import { NotFound } from './components/not-found/not-found';
import { MaterialModule } from './module/material-module';
import { AppStateModule } from '../store/app.state';
import { ShareModule } from '../shared/shared.module';
import { errorInterceptor } from './interceptors/error.interceptor';
import { tokenInterceptor } from './interceptors/token.interceptor';



@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        MaterialModule,
        AppStateModule,
        ReactiveFormsModule,
        ShareModule
    ],
    declarations: [
        Login,
        Navbar,
        NotFound
    ],
    providers: [
        DatePipe,
        DecimalPipe,
        provideHttpClient(
          withInterceptors([tokenInterceptor, errorInterceptor])
        ),
    ]
})
export class CoreModule {
  // Prevent re-importing
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it only in AppModule.');
    }
  }
}
