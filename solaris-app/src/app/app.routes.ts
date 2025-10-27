import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { NotFound } from './core/components/not-found/not-found';
import { Login } from './core/components/login/login';
import { Navbar } from './core/components/navbar/navbar';
import { authGuard } from './core/guards/auth.guard';

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
                canActivate: [authGuard],
                loadChildren: () => import('./features/central/pages/performance/performance-module').then(m => m.PerformanceModule)
            },
            {
                path: 'trend',
                canActivate: [authGuard],
                loadChildren: () => import('./features/central/pages/trend/trend-module').then(m => m.TrendModule)
            },
            {
                path: 'billing',
                canActivate: [authGuard],
                loadChildren: () => import('./features/central/pages/billing/billing-module').then(m => m.BillingModule)
            },
            {
                path: 'admin',
                canActivate: [authGuard],
                loadChildren: () => import('./features/central/pages/admin/admin-module').then(m => m.AdminModule)
            },
            {
                path: 'setting',
                canActivate: [authGuard],
                loadChildren: () => import('./features/central/pages/setting/setting-module').then(m => m.SettingModule)
            },
            {
                path: 'layout',
                canActivate: [authGuard],
                loadChildren: () => import('./features/sites/pages/layout/layout-module').then(m => m.LayoutModule)
            },
            {
                path: 'dashboard',
                canActivate: [authGuard],
                loadChildren: () => import('./features/sites/pages/dashboard/dashboard-module').then(m => m.DashboardModule)
            },
            {
                path: 'efficiency',
                canActivate: [authGuard],
                loadChildren: () => import('./features/sites/pages/performance/performance-module').then(m => m.PerformanceModule)
            },
            {
                path: 'realtime',
                canActivate: [authGuard],
                loadChildren: () => import('./features/sites/pages/realtime/realtime-module').then(m => m.RealtimeModule)
            },
            {
                path: 'charts',
                canActivate: [authGuard],
                loadChildren: () => import('./features/sites/pages/chart/chart-module').then(m => m.ChartModule)
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