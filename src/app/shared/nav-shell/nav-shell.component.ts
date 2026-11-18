// Una vegada construïda la llista de navegació TEACHER_NAV, caldrà convertir-la en elements visuals. Amb nav-shell.component.ts, rebem les dades del llistat

import { Component, Input } from '@angular/core';
import { NavItem } from '../models/nav-item.model';

@Component({
  selector: 'app-nav-shell',
  templateUrl: './nav-shell.component.html',
  styleUrl: './nav-shell.component.scss'
})
export class NavShellComponent {
  // Comunació entre components Pare-Fill
  @Input() roleLabel = ''; // Informació pare-fill per al header
  @Input() items: NavItem[] = []; // Connectem el component compartit amb teacher-nav.ts
}
