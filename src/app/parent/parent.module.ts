import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { ParentRoutingModule } from './parent-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';

import { SharedModule } from '../shared/shared.module';
import { AttendanceHistoryComponent } from './attendance/attendance-history/attendance-history.component';
import { GradesViewComponent } from './grades/grades-view/grades-view.component';

@NgModule({
  declarations: [
    DashboardComponent,
    AttendanceHistoryComponent,
    GradesViewComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    ParentRoutingModule,
    MatIcon,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule
  ]
})
export class ParentModule { }
