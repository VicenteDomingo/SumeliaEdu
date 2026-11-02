// Haviem desenvolupat un exercici molt semblant d'aquesta arquitectua de mòduls a la PAC 4 d'Angular avançat, qui m'ha servit d'inspiració per seguir una arquitectura semblat de mòduls (Admin, Teacher, Parent), per millor organitzar el projecte. 

// Aquest fitxer controla la navegació de tota l'aplicació. 

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { roleGuard } from './shared/guards/role.guard';

// Definim ací les rutes de la nostra aplicació SumeliaEdu
const routes: Routes = [ 
   // Ruta arrel -> redirigeix al login
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },

  // Mòdul d'autenticació (login, forgot password)
  // No té guards: qualsevol pot accedir
  {
    path: 'auth',
    loadChildren: () =>
      import('./auth/auth.module').then(m => m.AuthModule)
  },

  // Mòdul Admin
  // Doble protecció: sessió activa + rol admin. "With CanActivate, we check whether the user is logged in, according to the response from the isAuthentication function in the auth service, then we redirect to the login page if the user is not logged in. And we print an alert."https://medium.com/@yagmurgazezoglu/angular-authentication-canactivate-canactivatechild-guards-1b25772ec62a 

  // Amb authGuard, comprovem primer de tot si l'usuari ha iniciat sessió (té una sessió activa a Supabase). Si no té sessió activa, el guard redirigeix a la pàgina de login. https://dev.to/kingsley/building-secure-authentication-in-angular-with-supabase-2e1p 


  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('admin')],
    loadChildren: () =>
      import('./admin/admin.module').then(m => m.AdminModule)
  },

  // Mòdul Teacher
  {
    path: 'teacher',
    canActivate: [authGuard, roleGuard('teacher')],
    loadChildren: () =>
      import('./teacher/teacher.module').then(m => m.TeacherModule)
  },

  // Mòdul Parent
  {
    path: 'parent',
    canActivate: [authGuard, roleGuard('parent')],
    loadChildren: () =>
      import('./parent/parent.module').then(m => m.ParentModule)
  },

  // Qualsevol ruta desconeguda → redirigeix al login
  {
    path: '**',
    redirectTo: 'auth/login'
  }
]; 
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
