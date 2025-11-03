


import { Routes } from '@angular/router';
import { HomePage } from './home/home.page';

export const routes: Routes = [
  { path: '', component: HomePage },
  {
    path: 'bill',
    loadComponent: () => import('./bill/bill.page').then(m => m.BillPage),
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.page').then(m => m.SettingsPage),
  },
  {
    path: 'history',
    loadComponent: () => import('./history/history.page').then(m => m.HistoryPage),
  },
  { path: '**', redirectTo: '' },
  {
    path: 'bill',
    loadComponent: () => import('./bill/bill.page').then( m => m.BillPage)
  },
  {
    path: 'history',
    loadComponent: () => import('./history/history.page').then( m => m.HistoryPage)
  },
];
