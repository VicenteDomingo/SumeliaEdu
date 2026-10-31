import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';


import { ParentRoutingModule } from './parent-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';

import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    DashboardComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    ParentRoutingModule
  ]
})
export class ParentModule { }
