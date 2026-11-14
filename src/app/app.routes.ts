import { inject } from '@angular/core';
import { session } from './services/backend';
import { Router, Routes } from '@angular/router';
import { TabsPage } from './tabs/tabs.page';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'splashscreen',
    pathMatch: 'full',
  },
  {
    path: 'splashscreen',
    loadComponent: () =>
      import('./pages/splashscreen/splashscreen.page').then(
        (m) => m.SplashscreenPage
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  { path: 'places', loadComponent: () => import('./pages/map/map.page').then(m => m.MapPage) },
  { path: 'emergency', loadComponent: () => import('./pages/sos/sos.page').then(m => m.SosPage) },
  {
    path: 'signup',
    loadComponent: () =>
      import('./pages/signup/signup.page').then((m) => m.SignupPage),
  },

  {
    path: '',
    component: TabsPage,
    canActivateChild:[async()=>{const router=inject(Router);return (await session().catch(()=>null)) ? true : router.parseUrl('/login');}],
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'quiz',
        loadComponent: () =>
          import('./pages/quiz/quiz.page').then((m) => m.QuizPage),
      },
      {
        path: 'lessons',
        loadComponent: () =>
          import('./pages/lessons/lessons.page').then((m) => m.LessonsPage),
      },
      {
        path: 'sos',
        loadComponent: () =>
          import('./pages/sos/sos.page').then((m) => m.SosPage),
      },
      {
        path: 'progress',
        loadComponent: () =>
          import('./pages/progress/progress.page').then((m) => m.ProgressPage),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: 'contacts', redirectTo: '/sos', pathMatch:'full',
      },
      {
        path: 'map',
        loadComponent: () =>
          import('./pages/map/map.page').then((m) => m.MapPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full',
      },
    ],
  },
];
