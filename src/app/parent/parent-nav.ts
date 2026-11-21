import { NavItem } from '../shared/models/nav-item.model';

// Enllaços del menú de la família
export const PARENT_NAV: NavItem[] = [
  { label: 'Home', icon: 'home', route: '/parent/dashboard', enabled: true },
  { label: 'Attendance', icon: 'fact_check', route: '/parent/attendance', enabled: true },
  { label: 'Grades', icon: 'edit_note', route: '/parent/grades', enabled: false },
  { label: 'Announcements', icon: 'campaign', route: '/parent/announcements', enabled: false }
];