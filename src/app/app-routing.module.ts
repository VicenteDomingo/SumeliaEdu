import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { roleGuard } from './shared/guards/role.guard';

const routes: Routes = [
   // Ruta raíz → redirige al login
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },

  // Módulo de autenticación (login, forgot password)
  // NO tiene guards: cualquiera puede acceder
  {
    path: 'auth',
    loadChildren: () =>
      import('./auth/auth.module').then(m => m.AuthModule)
  },

  // Módulo Admin
  // Doble protección: sesión activa + rol admin
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('admin')],
    loadChildren: () =>
      import('./admin/admin.module').then(m => m.AdminModule)
  },

  // Módulo Teacher
  {
    path: 'teacher',
    canActivate: [authGuard, roleGuard('teacher')],
    loadChildren: () =>
      import('./teacher/teacher.module').then(m => m.TeacherModule)
  },

  // Módulo Parent
  {
    path: 'parent',
    canActivate: [authGuard, roleGuard('parent')],
    loadChildren: () =>
      import('./parent/parent.module').then(m => m.ParentModule)
  },

  // Cualquier ruta desconocida → redirige al login
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
