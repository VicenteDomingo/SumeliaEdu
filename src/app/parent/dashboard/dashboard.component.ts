import { Component, OnInit } from '@angular/core';
import { StudentService } from '../../shared/services/student.service';
import { ChildAttendanceService } from '../../shared/services/child-attendance.service';
import { SupabaseService } from '../../shared/services/supabase.service';
import { NotificationService } from '../../shared/services/notification.service';
import { 
  Attendance, 
  AttendanceWithSubject, 
  StudentWithClass 
} from '../../shared/models/database.models'; // Anem a treballar amb alumnat i registres d'assistència. Aquests models ens ajuden i comproven que estem emprant correctament les seues propietats
import { getMonday, toDateText } from '../../shared/utils/date-utils'; // Les funcions per a les dates. Consulten i organitzen l'assistència setmanal
import { 
  DayStatus,    // Estats d'assitència possibles. Incloem none
  getDayStatus, // Calculem l'estat general d'un dia
  STATUS_ICONS, // icona -> estat
  STATUS_LABELS,// estat -> etiqueta 
  STATUS_LETTERS// estat -> lletra
} from '../../shared/utils/attendance-utils';
import { PARENT_NAV } from '../parent-nav';

// Interfície que representa un dia de la setmana
interface WeekDay {
  letter: string;
  name: string;
  status: DayStatus;
}

// Interfície que representa la informació que necessitem per construir la tarjeta d'un fill/a
interface ChildCard {
  student: StudentWithClass; // dades de l'alumne i la seua classe
  todayStatus: DayStatus;    // estat general d'assistència d'avuí 
  todayCount: number;        // número de registres d'assistència d'avuí. Per assignatura
  week: WeekDay[];           // array -> els cinc dies de la setmana, M-F
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  // Propietats de la classe
  navItems = PARENT_NAV;  // enllaços del menu 
  today = new Date();     // data actual
  fullName = '';          // nom del familiar
  cards: ChildCard[] = [];// targetes dels fills. 1 per fill
  loading = true;         // estat de la càrrega de les dades

  // Per a l'HTML
  labels = STATUS_LABELS; // 
  letters = STATUS_LETTERS;
  icons = STATUS_ICONS;

  constructor(
    private supabase: SupabaseService,
    private studentService: StudentService,
    private childAttendanceService: ChildAttendanceService,
    private notification: NotificationService
  ) {}

  // S'inicia la càrrega del dashboard amb les funcions definides
  async ngOnInit() {
    await this.loadFullName(); // nom del familiar
    const children = await this.loadChildren(); // fills de l'usuari
    const records = await this.loadWeekRecords(children); // registres d'assistència

    this.cards = children.map(child => this.buildCard(child, records)); // Una tarjeta per a cada fill/a 
    this.loading = false; // passa a false ja que la càrrega ha finalitzat
  }

  // Mètode per al nom de la família. Ho usem a la salutació inicial
  private async loadFullName() {
    const profile = await this.supabase.getCurrentProfile();

    if (profile) {
      this.fullName = profile.full_name;
    }
  }

  // Mètode que recupera els fills de la família. Amb el RLS, la BBDD retorna sols els seus
  private async loadChildren(): Promise<StudentWithClass[]> { // La funció retorna una promesa. Tota funció async retorna una promesa: https://www.freecodecamp.org/news/learn-async-programming-in-typescript-promises-asyncawait-and-callbacks/. En resoldre's la promesa, el resultat serà un array d'alumnes tipus StudentWithClass[]
    const result = await this.studentService.getStudents();

    if (result.error) {
      this.notification.showError('Could not load your children.');
    }

    const students = result.data ?? [];
    return students.filter(student => student.active);
  }

  // Rebem els fills i recuperem els seus registres d'assistència des del dilluns de la setmana
  private async loadWeekRecords(children: StudentWithClass[]): Promise<AttendanceWithSubject[]> {
    if (children.length === 0) {
      return [];
    }

    const childIds = children.map(child => child.id);
    const monday = toDateText(getMonday(this.today));
    const result = await this.childAttendanceService.getAttendance(childIds, monday);

    if (result.error) {
      this.notification.showError('Could not load the attendance.');
    }

    return result.data ?? [];
  }

  // Mètode per construir la tarjeta del fill. 
  private buildCard(child: StudentWithClass, records: Attendance[]): ChildCard {
    const childRecords = records.filter(record => record.student_id === child.id);
    const todayText = toDateText(this.today);
    const todayRecords = childRecords.filter(record => record.date === todayText);

    return {
      student: child,
      todayStatus: getDayStatus(todayRecords),
      todayCount: todayRecords.length,
      week: this.buildWeek(childRecords)
    };
  }

  // Mètode per construir el resum setmanal (M-F). Cadascun amb el seu estat. Prepara 5 objectes WeekDay[], un per cada dia laborable
  private buildWeek(childRecords: Attendance[]): WeekDay[] {
    const names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const letters = ['M', 'T', 'W', 'T', 'F'];
    const monday = getMonday(this.today);
    const week: WeekDay[] = [];

    for (let i = 0; i < 5; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);

      const dayText = toDateText(day);
      const dayRecords = childRecords.filter(record => record.date === dayText);

      week.push({
        letter: letters[i],
        name: names[i],
        status: getDayStatus(dayRecords)
      });
    }

    return week;
  }
}
