// Amb el component TakeAttendanceComponent pretenem cobrir les següents responsabilitats:

// 1. Identificar al professor que ha iniciat sessió
// 2. Recuperar les matèries que imparteix
// 3. Seleccionar la matèria que vol utilitzar
// 4. Recuperar l'alumnat de la classe corresponent
// 5. Consultar si ja s'havia registrat l'assistència eixe dia
// 6. Permetre marcar a cada alumne com a P/AL/J
// 7. Permetre afegir notes
// 8. Guardar les dades a Supabase, total o parcialment

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router'; // "ActivateRoute provides access to information about the route, including route parameters, query parameters, and route URL segments." https://www.geeksforgeeks.org/angular-js/explain-the-purpose-of-activatedroute-in-angular/. Necessari per a teacher-routing.module.ts
import { AttendanceService } from '../../../shared/services/attendance.service'; 
import { SupabaseService } from '../../../shared/services/supabase.service';
import { NotificationService } from '../../../shared/services/notification.service';
import {
  AttendanceData,
  AttendanceStatus, 
  Student,
  SubjectWithClass
} from '../../../shared/models/database.models';
import { TEACHER_NAV } from '../../teacher-nav';

@Component({
  selector: 'app-take-attendance',
  templateUrl: './take-attendance.component.html',
  styleUrl: './take-attendance.component.scss'
})
export class TakeAttendanceComponent implements OnInit {

  navItems = TEACHER_NAV; // variable que conté els enllaços de navegació (passarem aquesta propietat la vista -> [items]="navItems")
  today = new Date();     // variable que emmagatzema la data actual
  todayText = '';         // variable per a la data en format string per enviar a Supabase
  schoolId = '';          // variable que emmagatzema l'id de l'escola

  subjects: SubjectWithClass[] = []; // variable que emmagatzema les assignatures del professor (array d'objectes de tipus SubjectWithClass[])
  selectedSubjectId = ''; // variable per emmagatzemar l'identificador de la matèria que el professor està utilitzant en eixe moment. Necessitem aquest id per consultar i guardar els registres d'assistència a Supabase
  students: Student[] = []; // variable qper emmagatzemar l'alumnat de la classe corresponent a la matèria seleccionada. [] -> array buit perquè encara no s'han carregat alumnes

  // Un "diccionario": para cada id de alumno, su estado ('' si no está marcado) "In TypeScript, a "dictionary" is a way to create a type-safe object for key-value pairs. There are two primary ways to define one: using the Record<K, V> utility type or an interface with an index signature. Both achieve type safety for keys and values." https://mimo.org/glossary/typescript/dictionary. 
  marks: Record<string, AttendanceStatus | ''> = {}; // Fem ús d'aquest diccionari per emmagatzemar informació mitjançant parells K-V (key-value -> UUIDAlumne-estat ). Aleshores, la propietat marks, emmagatzema l'estat d'assistència de cada alumne. Inicialitzem el diccionari amb un objecte buit {}, sense propietats ja que encara no coneixem els alumnes

  // Altre diccionari pero amb la nota de cada alumne
  notes: Record<string, string> = {}; // Clau -> UUID Alumne ; Valor -> string. Cada alumne pot tener un estat d'assistència i una nota diferent

  // Els 2 diccionaris tenen el mateix UUID de l'alumne. Així relacionem l'estat i la nota de cadascú

  // Propietat que conté la informació dels 4 estats possibles que podem assignar a cada alumne. Representa un llistat de 4 objectes amb valor, lletra i etiqueta. l'HTML la recorre per pintar els botons. D'aquesta manera no descrivim els 4 botons a mà. Angular genera un botó per cada objecte
  statuses: { value: AttendanceStatus; letter: string; label: string }[] = [
    { value: 'present', letter: 'P', label: 'Present' },
    { value: 'absent', letter: 'A', label: 'Absent' },
    { value: 'late', letter: 'L', label: 'Late' },
    { value: 'justified', letter: 'J', label: 'Justified' }
  ];

  // Propietats de control
  loading = true; // variable que ens indica si la pantalla està carregant la informació
  saving = false; // variable per indicar si estem guardant l'assistència a Supabase
  saved = false; // indica si s'ha completat el guardat de la llista

  constructor( // rebem les dependències (injecció) que necessita el component
    private route: ActivatedRoute,
    private attendanceService: AttendanceService,
    private supabase: SupabaseService,
    private notification: NotificationService
  ) {}

  async ngOnInit() {
    this.todayText = this.attendanceService.getToday(); // Obtenir la data actual per consultar els registres. Obtenim la data des del servei per usar el mateix format en diferents parts de l'aplicació. Així no repetim la lògica de construcció de la data

    const profile = await this.supabase.getCurrentProfile(); 

    if (!profile) { // hi ha perfil?
      this.loading = false;
      return;
    }

    this.schoolId = profile.school_id; // emmagatzemem l'id del centre del professor ja que cada registre d'assistència ha d'incluir l'id del centre

    // Recuperem les assignatures del professor
    const result = await this.attendanceService.getTeacherSubjects(profile.id); // volem mostrar sols les assignatures que imparteix el professor que ha iniciat sessió (data i error)

    if (result.error) { // si retorna error
      this.notification.showError('Could not load your subjects.');
    }

    this.subjects = result.data ?? []; // En cas que result.data té les assignatures, les guardem a this.subjects. La resta del component necessita treballar amb un array . Per exemple this.subjects = [mathematics, science, english ];

    // Una vegada tenim les matèries. Seleccionem la que volem obrir. 
    const idFromUrl = this.route.snapshot.paramMap.get('subjectId'); // Si entrem des del Dashboard (/teacher/attendance/subjectId)
    const subjectFromUrl = this.subjects.find(subject => subject.id === idFromUrl); // Si entrem des del menu general d'assistència (/teacher/attendance). Amb .find -> cerca la assignatura, el id de la qual siga igual al ID de la URL

    if (subjectFromUrl) { // Si .find troba la assignatura
      this.selectedSubjectId = subjectFromUrl.id; // la guardem 
    } else if (this.subjects.length > 0) { // Si no es compleix la condició anterior, comprovem aquesta condició (else if)
      this.selectedSubjectId = this.subjects[0].id;
    }

    await this.loadAttendance(); // Mètode del component
    this.loading = false;
  }

  // Getter per seleccionar la assignatura escollida
  get selectedSubject(): SubjectWithClass | undefined {
    return this.subjects.find(subject => subject.id === this.selectedSubjectId); // Amb el mètode .find, cerquem dins de subjects el subject l'id de la qual coincidisca amb this.selectedSubjectId
  }

  // Mètode que carrega l'alumnat i la assistència existent en el dia present. Preparem el llistat que veurà el professor. Recuperem allò que s'havia guardat per mostrar-ho
  async loadAttendance() {
    this.saved = false; // Reiniciem l'estat de guardat ja que anem a carregar una llista nova
    this.marks = {};    // Com que anem a treballar amb una nova llista d'alumnes, el diccionari passa objecte buit
    this.notes = {};    // El mateix amb les notes
    this.students = []; // Reiniciem la propietat students ja que la nova matèria podria pertànyer a altra classe

    const subject = this.selectedSubject; // El getter anterior ens serveix per recuperar l'objecte de l'assignatura seleccionada

    if (!subject) { // si no existeix una assignatura
      return;
    }

    const studentsResult = await this.attendanceService.getStudentsOfClass(subject.class_id); // emmagatzema l'alumnat corresponent a la classe de la assignatura. Cridem al servei i al mètode que recupera l'alumnat d'una classe. Li passem l'id de la classe de la assignatura -> .from('students').select('*').eq('class_id', classId).eq('active', true).order('full_name');
    const recordsResult = await this.attendanceService.getAttendance(subject.id, this.todayText); // emmagatzema l'assistència ja registrada

    if (studentsResult.error || recordsResult.error) { // Si hi ha errors
      this.notification.showError('Could not load the attendance list.');
    }

    this.students = studentsResult.data ?? []; // Guardem l'alumnat a students. Ara tenim el llistat d'alumnes que volem mostrar

    // Inicialitzem els diccionaris marks i notes per a cada alumne. Al principi no hi ha ningú marcat
    for (const student of this.students) { // Bucle for of per 1. crear una entrada a marks i 2. crear una entrada a notes. Per a cada alumne que hi ha a l'array this.students, executem les instruccions següents
      this.marks[student.id] = '';
      this.notes[student.id] = '';
    }

    // Recuperem els registres d'assistència que hem consultat anteriorment. Si hem guardat quelcom, ho posem als diccionaris i ho mostrem. Volem recuperar eixa informació i col·locar-la als diccionaris
    const records = recordsResult.data ?? [];
    for (const record of records) { // Amb aquest bucle for...of, recorrem els registres d'assistència. La variable record representa el registre que estem processant a cada vegada.
      this.marks[record.student_id] = record.status; // Key -> entrada de l'alumne dins del diccionari [identificador de l'alumne a qui pertany el registre] = substituim el valor inicial per l'estat que hem recuperat de Supabase
      this.notes[record.student_id] = record.note || ''; // Si el valor de l'esquerra es false o està buit, fem ús del valor de la dreta
    }

  }

  // Mètode per gestionar el canvi d'assignatura en pantalla, quan el professor utilitza el desplegable.rebem per paràmetre l'id de la assignatura (arriba desde l'HTML)
  async onSubjectChange(subjectId: string) { 
    this.selectedSubjectId = subjectId; // el getter retorna la matèria seleccionada
    await this.loadAttendance(); // renicia alumnat, estat d'assistència i notes i carrega els nous
  }

  // Mètode que ens permet marcar a cada alumne com a P/A/L/J
  setMark(studentId: string, status: AttendanceStatus) { // 2 paràmetres (Id de l'alumne que volem marcar i l'estat que volem assignar)
    this.marks[studentId] = status; // marcar a [l'alumne determinat] com a status

    if (status === 'present') { // si l'alumne està present...
      this.notes[studentId] = ''; // podem netejar la nota i/o actualitzar-la
    }
  }

  // Mètode que "facilita" la tasca al professor. Marca a tots presents
  markAllPresent() {
    for (const student of this.students) { // Recorre tot l'alumnat de la llista
      if (this.marks[student.id] === '') { // Alumne/a sense estat assignat?
        this.marks[student.id] = 'present'; // Assignem com a present
      }
    }
  }

  // Mètode per mostrar, o no, el camp de la nota per a l'alumne
  needsNote(studentId: string): boolean {
    const mark = this.marks[studentId]; // variable per desar el estat d'assitència de l'alumne
    return mark !== '' && mark !== 'present'; // l'alumne ha d'estar marcat i no com a present.retorna true per a A/L/J
  }

  // Getter per calcular l'alumnat que té un estat assignat
  get markedCount(): number {
    return this.students
      .filter(student => this.marks[student.id] !== '') // recorrem l'alumnat i conservem els que complisquen la condició. Té l'alumne cap estat assignat?
      .length; // número d'alumnat que ha superat el filtre. Així mostrem el progrés de la llista 
  }

  // Mètode per comptar sols l'alumnat que té un estat concret
  countStatus(status: AttendanceStatus): number { // rep un paràmetre status i retorna un número
    return this.students
      .filter(student => this.marks[student.id] === status) // Filtrem segons l'estat. Comparem l'estat de l'alumne amb l'estat que hem rebut com a paràmetre
      .length; // Comptem els alumnes que compleixen eixa condició
  }

  // Mètode per obtenir les inicials del nom de cada alumne. Ho emprem per al cercle "Pepito Grillo" -> "PG"
  getInitials(fullName: string): string {
    const words = fullName.split(' ');

    if (words.length === 1) {
      return words[0][0];
    }

    return words[0][0] + words[words.length - 1][0];
  }

  // Mètode per preparar les dades que enviarem a la base de dades
  // Cal recordar que hem construit una Utility Type ("Constructs an object type whose property keys are Keys and whose property values are Type. This utility can be used to map the properties of a type to another type." -> https://www.typescriptlang.org/docs/handbook/utility-types.html), que serveix a mode de "diccionari" per emmagatzemar els estats de l'alumnat i les notes. Amb aquest mètode, volem transformar eixa informació en un array d'objectes que té l'estructura que necessita la nostra taula attendance de la BBDD
  private buildRows(): AttendanceData[] { // El mètode no està disponible publicament. Private ja que indiquem que es una funció interna, no per ser usada directament des d'altres components. Retorna un array d'objectes tipus AttendanceData
    const rows: AttendanceData[] = []; // variable per emmagatzemar un array de registres d'assitència

    for (const student of this.students) { // this.students conté l'alumnat de la classe seleccionada. Aleshores, el bucle recorre cada alumne
      const mark = this.marks[student.id]; // variable per emmagatzemar l'estat segons l'id de l'alumne

      if (mark !== '') { // Comprovem que l'alumne tinga un estat assignat. Si disposa de qualsevol estat vàlid, entra en la condició i construïm el seu registre
        rows.push({ // .push per afegir l'objecte a l'array rows. 1 fila per cada alumne
          school_id: this.schoolId,             // id de l'escola
          student_id: student.id,               // id de l'alumne
          subject_id: this.selectedSubjectId,   // id de l'assignatura
          date: this.todayText,                 // data d'assitència
          status: mark,                         // estat de l'alumne
          note: this.notes[student.id] || null  // nota o null si no existeix
        });
      }
    }

    return rows; // retorna les dades preparades
  }

  // Mètode que comprova si hi ha cap problema que impedeix desar l'assistència. Volem conèixer si existeix cap problema abans de desar
  private getSaveError(complete: boolean, rows: AttendanceData[]): string { // 1r paràmetre -> complete: true si volem desar la llista / complete: false si volem desar un borrador. El 2n paràmetre reb l'array que hem construit amb buildRows(). Així reb els registres que estem preparant per guardar. El mètode retorna un :string -> volem saber no sols si existeix error, també el missatge a mostrar
    if (complete && rows.length < this.students.length) { // comprovem si complete -> estem guardant la llista com a completa i comparem el num de registres amb el num total d'alumnes
      return 'Mark all students before saving the list.';
    }

    if (rows.length === 0) { // si no hi ha alumnat marcat
      return 'Mark at least one student.';
    }

    return ''; // si no hi ha errors, passem a guardar (save())
  }

  // Mètode que mostra el missatge corresponent quan la operació de guardat acaba correctament
  private showSavedMessage(complete: boolean) { // true -> s'ha guardat / false -> desat parcialment o borrador. No hi ha return. No necessitem retornar res ací 
    if (complete) { // Si la llista està completa (true)
      this.saved = true; // modifiquem la propietat del component a true
      this.notification.showSuccess('Attendance saved.');
    } else { // En cas que complete -> false
      this.notification.showSuccess('Draft saved. You can finish the list later.');
    }
  }

  // Guardar. Si complete es true, exige que todos estén marcados Mètode per desar l'assistència
  async save(complete: boolean) {
    const rows = this.buildRows(); // contruim els registres en primer lloc. Recorrem l'alumnat i prepara un array en els registres d'assistència. El mètode buildRows(): AttendanceData[] ja l'hem dissenyat abans
    const problem = this.getSaveError(complete, rows); // si volem desar la llista completa i els registres que hem preparat. Retorna un missatge d'error, si hi ha, o un string buit, si tot està correcte

    if (problem) { // si problem !== ''
      this.notification.showError(problem);
      return;
    }

    this.saving = true; // indiquem que estem guardant
    const { error } = await this.attendanceService.saveAttendance(rows); // instrucció que guarda les dades. Cridem al mètode saveAttendance() del servei. Amb desestructuració obtenim la dada que necessitem
    this.saving = false; // Quan Supabase retorna el resultat, canviem el booleà a false

    if (error) { // En cas que Supabase retorne error...
      this.notification.showError('Could not save the attendance. Try again.');
      return;
    }

    this.showSavedMessage(complete);
  }
}
