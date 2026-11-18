// Interfície que emmagatzema cada element (enllaç) de navegació 
export interface NavItem {
  label: string;
  icon: string;
  route: string; // per exemple '/teacher/attendance'
  enabled: boolean; // propietat per mostrar si l'enllaç (funcionalitat) està disponible o no
}
