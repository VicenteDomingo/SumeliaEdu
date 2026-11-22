import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { SharedModule } from '../shared/shared.module';
import { TeacherRoutingModule } from './teacher-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { TakeAttendanceComponent } from './attendance/take-attendance/take-attendance.component';
import { EnterGradesComponent } from './grades/enter-grades/enter-grades.component';

@NgModule({
  declarations: [
    DashboardComponent,
    TakeAttendanceComponent,
    EnterGradesComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    SharedModule,
    TeacherRoutingModule
  ]
})
export class TeacherModule { }
