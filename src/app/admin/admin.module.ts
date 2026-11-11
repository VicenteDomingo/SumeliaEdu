import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  FormsModule, 
  ReactiveFormsModule 
} from '@angular/forms';
import { AdminRoutingModule } from './admin-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs'; // https://material.angular.dev/components/tabs/overview
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { SharedModule } from '../shared/shared.module';
import { StudentListComponent } from './students/student-list/student-list.component';
import { StudentFormComponent } from './students/student-form/student-form.component';
import { ClassesPageComponent } from './classes/classes-page/classes-page.component';
import { ClassFormComponent } from './classes/class-form/class-form.component';
import { SubjectFormComponent } from './classes/subject-form/subject-form.component';

@NgModule({
  declarations: [
    DashboardComponent,
    StudentListComponent,
    StudentFormComponent,
    ClassesPageComponent,
    ClassFormComponent,
    SubjectFormComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    AdminRoutingModule
  ]
})
export class AdminModule { }
