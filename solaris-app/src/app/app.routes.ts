import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { NotFound } from './core/components/not-found/not-found';
import { Login } from './core/components/login/login';
import { Navbar } from './core/components/navbar/navbar';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/main/overview',
        pathMatch: 'full'
    },
    {
        path: 'not-found',
        component: NotFound
    },
    {
        path: 'login',
        component: Login,
    },
    {
        path: 'main',
        component: Navbar,
        children: [
            {
                path: 'overview',
                loadChildren: () => import('./features/central/pages/overview/overview-module').then(m => m.OverviewModule)
            },
            {
                path: 'performance',
                loadChildren: () => import('./features/central/pages/performance/performance-module').then(m => m.PerformanceModule)
            },
            {
                path: 'trend',
                loadChildren: () => import('./features/central/pages/trend/trend-module').then(m => m.TrendModule)
            },
            {
                path: 'billing',
                loadChildren: () => import('./features/central/pages/billing/billing-module').then(m => m.BillingModule)
            },
            {
                path: 'admin',
                loadChildren: () => import('./features/central/pages/admin/admin-module').then(m => m.AdminModule)
            },
            {
                path: 'setting',
                loadChildren: () => import('./features/central/pages/setting/setting-module').then(m => m.SettingModule)
            },
        ]
    },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    useHash: true,
    preloadingStrategy: PreloadAllModules
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }