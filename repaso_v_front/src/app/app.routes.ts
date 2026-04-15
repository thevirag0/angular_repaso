import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./components/login/login').then(m => m.Login)
    },
    {
        path: 'user-list',
        loadComponent: () => import('./components/user-list/user-list').then(m => m.UserList)
    },
    {
        path: 'clients',
        loadComponent: () => import('./components/client/client').then(m => m.Client)
    }
];
