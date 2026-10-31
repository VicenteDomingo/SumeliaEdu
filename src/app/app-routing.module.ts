import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { roleGuard } from './shared/guards/role.guard';

const routes: Routes = [
   // Ruta arrel -> redirigeix al login
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },

  // Mòdul d'autenticació (login, forgot password)
  // No ten guards: qualsevol pot accedir
  {
    path: 'auth',
    loadChildren: () =>
      import('./auth/auth.module').then(m => m.AuthModule)
  },

  // Mòdul Admin
  // Doble protecció: sessió activa + rol admin
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
]; // Definim ací les rutes de l'aplicació SumeliaEdu
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
