import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AttendanceHistoryComponent } from './attendance/attendance-history/attendance-history.component';
import { GradesViewComponent } from './grades/grades-view/grades-view.component';
const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'attendance', component: AttendanceHistoryComponent },
  { path: 'attendance/:childId', component: AttendanceHistoryComponent },
  { path: 'grades', component: GradesViewComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ParentRoutingModule { }
