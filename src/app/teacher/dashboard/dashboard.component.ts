// Arxiu que conté la lògica de funcionament del dashboard. En accedir el mestre/a, volem mostrar informació sobre les assignatures i l'estat de la assistència del dia.

import { Component, OnInit } from '@angular/core';
import { AttendanceService } from '../../shared/services/attendance.service'; // volem conèixer les assignatures del professor i la assistència que s'ha registrat avui (getTeacherSubjects(); getAttendanceOfSubjects(); getToday())
import { StudentService } from '../../shared/services/student.service'; // volem conèixer l'alumnat actiu en cada classe (getStudents())
import { SupabaseService } from '../../shared/services/supabase.service'; // volem conèixer el perfil de l'usuari que ha iniciat sessió (getCurrentProfile() -> profile.id per a l'identificador del professor)
import { NotificationService } from '../../shared/services/notification.service';
import { 
  Attendance, 
  SubjectWithClass 
} from '../../shared/models/database.models'; 
import { TEACHER_NAV } from '../teacher-nav'; // configuració dels enllaços del menu del professor

// Definim ací una interfície tipada TodaySubject. Definim un objecte tipus SubjectWithClass, que representa l'estructura de cada assignatura en aquest dashboard en concret. Volem reunir en un mateix objecte tota la informació necessària per representar el progrès d'una assignatura
interface TodaySubject {
  subject: SubjectWithClass; // dades de l'assignatura i el nom de la classe relacionada
  total: number;     // alumnat actiu a la classe
  marked: number;    // alumnat ja marcat
  done: boolean;     // lista completa?
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  navItems = TEACHER_NAV; // variable que guarda el llistat d'enllaços. L'HTML ho puga llegir
  today = new Date(); 
  todaySubjects: TodaySubject[] = []; // variable tipada amb array d'objectes TodaySubjects[]. Emmagatzema llistat d'assignatures amb el progrès d'assistència. Inicialitzem amb un array buit []
  loading = true; 

  constructor( // Injectem els 4 serveis
    private supabase: SupabaseService,
    private attendanceService: AttendanceService,
    private studentService: StudentService,
    private notification: NotificationService
  ) {}

  async ngOnInit() {
    const profile = await this.supabase.getCurrentProfile(); // variable per obtenir el perfil del professor. Ens interessa profile.id 

    if (!profile) { // Si no obtenim el perfil...
      this.loading = false; // loading passa a false, no carrega el dashboard
      return; // i eixim. No executa la resta
    }

    const subjectsResult = await this.attendanceService.getTeacherSubjects(profile.id); // variable que guarda les assignatures del professor. AtendanceService -> getTeacherSubjects -> profile.id
    const studentsResult = await this.studentService.getStudents(); // guardem ací tot l'alumnat actiu. Per saber si un llistat està complet, cal conèixer quants alumnes deurien estar inclosos. 

    if (subjectsResult.error || studentsResult.error) { // En cas que les consultes fallen
      this.notification.showError('Could not load your classes.');
    }

    const subjects = subjectsResult.data ?? []; // variable que guarda les assignatures recuperades de Supabase
    const activeStudents = (studentsResult.data ?? []).filter(student => student.active); // variable que recupera l'alumnat actiu. Amb el mèdode .filter, recorrem tot l'alumnat i ens quedem únicament en aquell, el camp actiu dels quals siga true 

    // Variable let que emmagatzema els registres d'assistència. let i no const perquè modifiquem el seu valor posteriorment. S'inicialitza amb un array buit ja que encara no hem consultat l'assistència
    let records: Attendance[] = [];

    if (subjects.length > 0) { // Comprovem si el professor té assignatures
      const subjectIds = subjects.map(subject => subject.id); // aleshores, fem un mapeig. Recorrem cada assignatura i creem altra llista transformant cada element. Ací convertim el llistat d'assignatures en llistat de ids. Ho necessitem per el mètode creat getAttendanceOfSubjects() necessita rebre els ids de les matèries per a buscar els seus registres a la taula attendance 

      // variable que emmagatzema el resultat de la consulta d'assistència
      const recordsResult = await this.attendanceService.getAttendanceOfSubjects( // cal cridar al mètode del servei d'assistència. Ens permet consultar l'assistència de varies matèries en una mateixa data. Reb 2 paràmetres -> 
        subjectIds, // Array d'ids d'assignatures
        this.attendanceService.getToday() // la data actual
      ); 

      records = recordsResult.data ?? []; // variable que emmagatzema els registres trobats a records. Així, si recordsResult té registres, els guardem a records. En cas contrari, null o undefined, guardem un array buit
    }

    // Calculem el progrés de cada assignatura. Per a cada una contem alumnat i marques
    // Assignem un nou valor a todaySubjects. Hem d'usar this perquè todaySubjects és una propietat de la classe DashboardComponent. Aleshores, this.todaySubjects fa referència a eixa propietat
    this.todaySubjects = subjects.map(subject => { // Mapeig per recuperar cada assignatura de l'array subjects. .map retorna un nou array però nosaltres volem convertir/retornar objectes TodaySubject que continga la assignatura i el seu progrés

      const total = activeStudents.filter(student => student.class_id === subject.class_id).length; // variable que: 1. Filtra alumnat de la classe corresponent (.filter); 2. Compta quants hi ha; 3. Guarda eixe número
      const marked = records.filter(record => record.subject_id === subject.id).length; // variable per calcular quants alumnes hi ha marcats. Volem saber quants registres d'assistència existeixen per a la matèria que estem processant

      // Retorna l'objecte TodaySubject. Com que estem dins d'una funció que empra map(), cada cop que processem una assignatura, necessitem retornar un objecte -> https://adam-drake-frontend-developer.medium.com/a-deep-dive-into-the-javascript-map-method-048f6eadf1b2
      return {
        subject: subject, // guardem la assignatura que estem processant
        total: total,     // guardem el número d'alumnat actiu de la classe
        marked: marked,   // guardem el número d'alumnat que ja te registrada l'assistència
        done: total > 0 && marked >= total // condició que ens dirà si la llista està completa. Si hi ha alumnat i (&&) el número de registres d'assistència és igual o superior al nº d'alumnat actiu
      };
    });

    this.loading = false; // hem acabat el procés de càrrega. La vista mostra el contingut al dashboard
  }

  // Getter per identificar la primera assigatura la llista d'assistència de la cual encara no està completa
  get firstPending(): TodaySubject | undefined {
    return this.todaySubjects.find(item => !item.done); // de l'array que hem construit abans, cerca el 1r element que cumplisca la condició -> !item.done -> llista no està completa
  }
}
