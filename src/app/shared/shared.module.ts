// Mòdul de components reutiltizables. Ací declarem el HeaderComponent, així com el NavShellComponent. A més, importem les dependeències necessàries per a funcionar i les exportem. 
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NavShellComponent } from './nav-shell/nav-shell.component';
import { RouterModule } from '@angular/router';


@NgModule({
  declarations: [
    HeaderComponent,
    NavShellComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule
  ],
  exports: [
    HeaderComponent,
    NavShellComponent
  ]
})
export class SharedModule { }
