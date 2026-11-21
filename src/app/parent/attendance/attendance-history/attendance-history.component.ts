import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router'; // "Provides access to information about a route associated with a component that is loaded in an outlet" -> https://angular.dev/api/router/ActivatedRoute. Per consultar informació sobre la ruta actual -> recuperar l'id del fill (:childId). Quin fill consultar?
import { StudentService } from '../../../shared/services/student.service'; // Consultar l'alumnat vinculat a la família
import { ChildAttendanceService } from '../../../shared/services/child-attendance.service'; // Consultar els registres d'assistència dels fills
import { NotificationService } from '../../../shared/services/notification.service';
import {
  AttendanceStatus,
  AttendanceWithSubject,
  StudentWithClass
} from '../../../shared/models/database.models';
import { 
  getMonday, // utils -> per calcular el dilluns de la setmana actual
  toDateText // utils -> convertimm data al format PostgreSQL
} from '../../../shared/utils/date-utils';
import { 
  DayStatus, 
  getDayStatus, 
  STATUS_LABELS 
} from '../../../shared/utils/attendance-utils';
import { PARENT_NAV } from '../../parent-nav';

const ALL_TIME = '2000-01-01'; // Creem constant per portar tot l'historial de l'alumne

type Period = 'week' | 'month' | 'all'; // "A union type is a type that allows a variable to be one of several types. This means that the variable can hold a value that matches any one of the types specified. You define a union type using the pipe (|) symbol." https://medium.com/@meetpujara02/understanding-union-types-in-typescript-a-deep-dive-36b27eeae808 -> S'admeten 3 valors


interface DayRow {   // Estructura de l'objecte DayRow. Un dia de l'historial
  date: string;      // Data del dia 
  status: DayStatus; // L'estat general del dia
  records: AttendanceWithSubject[]; // Registres d'asistència del dia
}

// Interfície que defineix l'estructura de les estadístiques: quants dies amb cada estat? 
interface Stats {
  present: number;
  absent: number;
  late: number;
  justified: number;
}

@Component({
  selector: 'app-attendance-history',
  templateUrl: './attendance-history.component.html',
  styleUrl: './attendance-history.component.scss'
})
export class AttendanceHistoryComponent implements OnInit {

  navItems = PARENT_NAV; // emmagatzemem el menú de navegació
  today = new Date(); // data actual del dispositiu 
  labels = STATUS_LABELS; // diccionari d'etiquetes

  children: StudentWithClass[] = []; // emmagatzema els fills de la família
  selectedChildId = ''; // emmagatzema l'id del fill seleccionat
  allRecords: AttendanceWithSubject[] = []; // desa els registres d'assistència del fill seleccionat

  period: Period = 'week'; // el periode seleccionat. Comença amb la setmana actual
  days: DayRow[] = []; // emmagatzemem els dies agrupats. Propietat que recorre la vista per construir el llistat diari
  stats: Stats = { present: 0, absent: 0, late: 0, justified: 0 }; // variable que desa els 4 comptadors

  // Preparem les 4 targetes que representen l'estadística d'assistència
  statBoxes: { 
    key: AttendanceStatus; label: string }[] = [ // Un array que conté objectes amb una propietat key, el valor de la qual es un estat d'assistència, i una propietat label, que es un text
    { key: 'present', label: 'Present' },
    { key: 'absent', label: 'Absent' },
    { key: 'late', label: 'Late' },
    { key: 'justified', label: 'Justified' }
  ];

  // Representa els tres filtres -> setmana, més, tot
  periods: { value: Period; label: string }[] = [
    { value: 'week', label: 'This week' },
    { value: 'month', label: 'This month' },
    { value: 'all', label: 'All' }
  ];

  loading = true;

  constructor( // injecció de dependències
    private route: ActivatedRoute,
    private studentService: StudentService,
    private childAttendanceService: ChildAttendanceService,
    private notification: NotificationService
  ) {}

  async ngOnInit() { // Executa ngOnInit() en iniciar el component. És asíncron ja que volem consultar informació a Supabase
    await this.loadChildren(); // Recuperem els fills de la família
    this.selectChildFromUrl(); // Cal comprovar si la direcció del navegador conté un id de fill
    await this.loadRecords(); // Recuperem l'assistència del fill
    this.loading = false;
  }

  // Getter per obtenir el fill/a que estem veient. A partir de la llista children i l'id 
  get selectedChild(): StudentWithClass | undefined {
    return this.children.find(child => child.id === this.selectedChildId); // per a cada fill que examine .find, cal comprovar si el seu id coincideix amb l'id seleccionat (retorna el 1r element)
  }

  // Mètode per recuperar l'alumnat vinculat a la família. La BBDD amb RLS ja retorna els seus
  private async loadChildren() {
    const result = await this.studentService.getStudents();

    if (result.error) { // Si la consulta retorna un error...
      this.notification.showError('Could not load your children.');
    }

    const students = result.data ?? []; // "logical operator that returns its right-hand side operand when its left-hand side operand is Either null or undefined, and otherwise returns its left-hand operand" https://medium.com/@mfarazali/nullish-coalescing-operator-in-javascript-c63cab8cce41 -> Si result.data té dades, les usem. Si es null o undefined, fes ús de l'array buit
    this.children = students.filter(student => student.active); // filtrem l'alumnat actiu
  }

  // Seleccionem al fill, bé des del botó del dashboard, o des del menú attendance
  private selectChildFromUrl() {
    const idFromUrl = this.route.snapshot.paramMap.get('childId'); // variable que emmagatzema l'id de la direcció del navegador. Fem ús del servei ActivatedRoute: "Es un servicio que nos permite acceder a los parámetros de la URL dentro de un componente." https://www.freecodecamp.org/espanol/news/rutas-en-angular-como-implementarlas/
    const childFromUrl = this.children.find(child => child.id === idFromUrl); // amb el mètode .find, cerquem el fill (de l'array que hem recuperat a loadChildren) l'id del qual === al que acabem de llegir a la URL

    if (childFromUrl) { // Si l'hem trobat...
      this.selectedChildId = childFromUrl.id; // ...guardem a la variable
    } else if (this.children.length > 0) { // ...si no
      this.selectedChildId = this.children[0].id; // seleccionem el primer de la llista
    }
  }

  // Mètode per recuperar tots els registres d'assistència del fill seleccionat. Ho guardem a allRecords
  private async loadRecords() {
    if (this.selectedChildId === '') { // l'id del fill seleccionat és un string buit?
      this.allRecords = []; // aleshores, buidem l'arrya de registres
      this.applyPeriod(); // el mètode aplica el filtre del periode seleccionat i actualitza: days(dies que apareguen a l'historial), stats(estadístiques d'assistència). En cas de no tenir registres, necessitem que també s'actualitze a la pantalla per reflexar eixa situació
      return; // Si no hi ha fill seleccionat: 1. buidem allRecords; 2. Executem applyPeriod(); 3. S'acaba. No hi ha consulta a la BBDD -> no té sentit si no hi a id d'alumne
    }

    const result = await this.childAttendanceService.getAttendance( // mitjançant el mètode getAttendance(), fem la consulta a la BBDD
      [this.selectedChildId], // 1r argument -> id entre corxets ja que el servei espera un array d'ids (studentIds: string[])
      ALL_TIME // 2n argument -> data inicial des de la que volem recuperar (data antiga)
    );

    if (result.error) {
      this.notification.showError('Could not load the attendance.');
    }

    this.allRecords = result.data ?? []; // desem els registres
    this.applyPeriod(); // una vegada guardem les dades -> apliquem el filtre del periode actual
  }

  // Mètode per canviar de fill
  async onChildChange(childId: string) { // passem per paràmetre l'id del fill seleccionat
    this.selectedChildId = childId; // desem el nou id
    await this.loadRecords(); // i carreguem els seus registres
  }

  // Mètode per cambiar el periode per consultar l'assistència (this week-This month-All)
  setPeriod(period: Period) { // paràmetre de tipus Period (week-month-all)
    this.period = period;
    this.applyPeriod(); // executem el mètode que realitza aquest treball
  }

  // La fecha desde la que se cuenta. '' significa "sin límite". Mètode per calcular la data a partir de la qual volem mostrar els registres
  private getFromDate(): string { // retorna un string. Les dates d'assistència de Supabase s'emmagatzemen amb format text
    if (this.period === 'week') { // si seleccionem setmana...
      return toDateText(getMonday(this.today));
    }

    if (this.period === 'month') { // si seleccionem mes...
      const firstOfMonth = new Date(this.today.getFullYear(), this.today.getMonth(), 1); // variable que representa el primer dia del mes actual. 
      // 1. new Date(...) -> nou objecte de data
      // 2. this.today.getFullYear() -> obtenim l'any de la data actual
      // 3. this.today.getMonth() -> obtenim el mes actual
      // 4. posem 1 com a últim argument -> volem sempre el 1r dia del més
      return toDateText(firstOfMonth); // convertim la data a format text
    }

    return ''; // si el periode es 'all', retornem cadena buida ja que volem mostrar tot l'historial disponible
  }

  // Mètode per aplicar el filtre seleccionat i actualitzar dues propietats: days -> historial per dies; stats -> estadístiques d'assistència
  private applyPeriod() {
    const from = this.getFromDate(); // variable per desar el mètode anterior. Farem ús en varies ocasions
    let records = this.allRecords; // variable amb tots els registres d'assistència que hem recuperat de la BBDD

    if (from !== '') { // Hi ha data inicial? 
      records = this.allRecords.filter(record => record.date >= from); // amb el mètode filter recorrem l'array i creem altre amb els elements que complisquen la condició (record.date >= from) -> comparar la data de cada registre amb la data inicial
    }

    this.days = this.groupByDay(records); // historial agrupat per dies
    this.stats = this.countStats(this.days); // Una vegada agrupats, calculem les estadístiques
  }

  // Mètode que agrupa els registres d'assistència per data -> una fila per data
  private groupByDay(records: AttendanceWithSubject[]): DayRow[] { // rep un array de registres d'assistència amb informació de l'assignatura. Amb DayRow[], retorna un array d'objectes del mateix tipus
    const days: DayRow[] = []; // encara no hem processat cap registre

    for (const record of records) { // recorrem els registres amb un bucle for ...of. records -> array que rebem; record -> registre que estem examinant en cada volta
      let day = days.find(item => item.date === record.date); // cerquem si ja existeix eixe dia. Amb 'item.date === record.date', comparem la data del dia que estem buscant amb la data del registre actual

      if (!day) { // si no hem trobat el dia...
        day = { date: record.date, status: 'none', records: [] }; // ...creem un nou dia
        days.push(day); // l'afegim a l'array. Encara no està la assignatura
      }

      day.records.push(record); // afegim el registre al dia corresponent
    }

    for (const day of days) { // Ara calculem l'estat general de cada dia. Recorrem dies complets
      day.status = getDayStatus(day.records); // cridem a la funció getDayStatus() i li passem tots els registres d'assistència
    }

    return days; // retornem l'array de dies ya agrupats i els estats generals calculats
  }

  // Una vegada els dies agrupats, volem calcular les estadístiques. Comptem quants dies hi ha amb cada estat
  private countStats(days: DayRow[]): Stats { // reb com a paràmetre un arra de dies ja agrupats. Retorna :Stats -> els quatre comptadors numèrics 
    const stats: Stats = { present: 0, absent: 0, late: 0, justified: 0 }; // creem un objecte amb els comptadors inicialitzats a 0 -> encara no tenim cap dia 

    for (const day of days) { // recorrem l'array de dies que hem rebut. Cal deixar clar que comptem dies i no assignatures
      if (day.status !== 'none') { // Si el dia té un estat real, que no siga 'none'
        stats[day.status] += 1; // imaginem que day.status = 'absent', aleshores -> stats.absent = stats.absent + 1. Accedim de forma dinàmica a la propietat
      }
    }

    return stats; // retornem l'objecte amb els comptadors calculats
  }
}
