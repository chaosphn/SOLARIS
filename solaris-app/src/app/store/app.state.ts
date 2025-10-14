import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { navReducer } from './reducers/nav.reducer';
import { siteReducer } from './reducers/site.reducer';


@NgModule({
  imports: [
    StoreModule.forRoot({ nav: navReducer, site: siteReducer })
    // or for feature module:
    // StoreModule.forFeature('nav', navReducer)
  ]
})
export class AppStateModule {}