import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { TakeAttendanceComponent } from './attendance/take-attendance/take-attendance.component';


const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  // Observem dues rutes per al mateix component. Amb 'subjectId', la pantalla obri directament eixa matèria (botó "Take" del dashboard). Sense ell, s'obri la primera (així funciona el menú)
  { path: 'attendance', component: TakeAttendanceComponent },
  { path: 'attendance/:subjectId', component: TakeAttendanceComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TeacherRoutingModule { }
