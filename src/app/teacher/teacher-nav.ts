import { NavItem } from '../shared/models/nav-item.model';

// Enllaços del menú del professor. A un arxiu a part ja que ho utilitzen diferents pantalles (DRY)
// Nom de la constant en majúscules. Convenció per a constants que representen configuracions compartides (https://ts.dev/style/#identifiers -> global constant values)
export const TEACHER_NAV: NavItem[] = 
[
  { 
    label: 'Home', // Pàgina principal ({ path: 'dashboard', component: DashboardComponent })
    icon: 'home', 
    route: '/teacher/dashboard', 
    enabled: true 
  },

  { 
    label: 'Attendance', // Funcionalitat prioritària: passar llista
    icon: 'fact_check', 
    route: '/teacher/attendance', 
    enabled: true 
  },

  { 
    label: 'Grades', // Qualificacions
    icon: 'edit_note', 
    route: '/teacher/grades', 
    enabled: true // Encara no el tenim habilitat
  },

  { 
    label: 'Announcements', // Anuncis
    icon: 'campaign', 
    route: '/teacher/announcements', 
    enabled: false 
  },

  { 
    label: 'Messages', // Missatges
    icon: 'chat', 
    route: '/teacher/messages', 
    enabled: false 
  }
];