import { Component, OnInit } from '@angular/core';
import { StudentService } from '../../../shared/services/student.service'; // Per obtenir els fills de la família que inicia sessió. Sense consulta a la BBDD. Reutilitzem el servei
import { GradeService } from '../../../shared/services/grade.service'; // Per recuperar les notes del fill seleccionat
import { NotificationService } from '../../../shared/services/notification.service';
import { 
  GradeWithSubject, 
  StudentWithClass, 
  Term } from '../../../shared/models/database.models';
import { // Les funcions per calcular les notes
  averageOf, 
  getLevel, 
  GradeLevel, 
  toPercent 
} from '../../../shared/utils/grade-utils';
import { PARENT_NAV } from '../../parent-nav';

// Interfície que representa la targeta d'una assignatura: les seues notes i la mitjana
interface SubjectCard {
  subjectId: string;
  name: string;
  grades: GradeWithSubject[];
  average: number | null;
}

@Component({
  selector: 'app-grades-view',
  templateUrl: './grades-view.component.html',
  styleUrl: './grades-view.component.scss'
})
export class GradesViewComponent implements OnInit {

  navItems = PARENT_NAV; // 

  children: StudentWithClass[] = []; // desem els fills de la família. Un array d'alumnes amb informació de la seua classe
  selectedChildId = ''; // desem el fill/a seleccionat/a

  allGrades: GradeWithSubject[] = []; // desem les notes del fill seleccionat. Dels 3 Terms
  term: Term = 1; // Inicialment deixem seleccionat el Term 1
  terms: Term[] = [1, 2, 3]; // Els terms disponibles

  cards: SubjectCard[] = []; // desem les targetes de les assignatures que mostrem a la vista
  overall: number | null = null; // desem la mitjana general del term

  loading = true;

  constructor(
    private studentService: StudentService,
    private gradeService: GradeService,
    private notification: NotificationService
  ) {}

  async ngOnInit() { // similar al les classes anteriors. carreguem les dades en iniciar el component
    await this.loadChildren(); // obtenim els fills de la família
    await this.loadGrades(); // obtenim les notes del fill
    this.loading = false;
  }

  // Getter que retorna el fill seleccionat
  get selectedChild(): StudentWithClass | undefined {
    return this.children.find(child => child.id === this.selectedChildId);
  }

  // Mètode que s'encarrega de carregar als fills de la família i seleccionar automàticament al primer. La BBDD (RLS) retorna sols els seus
  private async loadChildren() {
    const result = await this.studentService.getStudents();

    if (result.error) {
      this.notification.showError('Could not load your children.');
    }

    const students = result.data ?? [];
    this.children = students.filter(student => student.active);

    if (this.children.length > 0) {
      this.selectedChildId = this.children[0].id;
    }
  }

  // Mètode per obtenir totes les notes del fill seleccionat (3 terms) i preparar les dades per mostrar-ho a la interfície
  private async loadGrades() {
    if (this.selectedChildId === '') {
      return;
    }

    const result = await this.gradeService.getChildGrades(this.selectedChildId);

    if (result.error) {
      this.notification.showError('Could not load the grades.');
    }

    this.allGrades = result.data ?? [];
    this.applyTerm();
  }

  // Mètode que executem quan la família selecciona un altre fill
  async onChildChange(childId: string) {
    this.selectedChildId = childId;
    await this.loadGrades();
  }

  // Mètode s'executa en prémer la família un altre term
  setTerm(term: Term) {
    this.term = term;
    this.applyTerm();
  }

  // Filtra por trimestre y recalcula las tarjetas y la media general Mètode que connecta les dades que hem descarregat de Supabase amb la informació que finalment veurà la família. 1. Seleccionem les notes del term escollit ; 2. Agrupem eixes notes per matèria i calculem la mitjana general
  private applyTerm() {
    const grades = this.allGrades.filter(grade => grade.term === this.term);

    this.cards = this.buildCards(grades);
    this.overall = this.getOverall(this.cards);
  }

  // Agrupa las notas por asignatura: una tarjeta por asignatura Mètode que agruparà totes les notes d'una matèria dins d'una targeta. Recorrem les notes i crea una targeta per matèria. Amb .card.find() -> cerquem si ja existeix. En cas que no existica, la creem i s'afegeix
  private buildCards(grades: GradeWithSubject[]): SubjectCard[] {
    const cards: SubjectCard[] = [];

    for (const grade of grades) {
      let card = cards.find(item => item.subjectId === grade.subject_id);

      if (!card) {
        const name = grade.subjects ? grade.subjects.name : 'Unknown';
        card = { subjectId: grade.subject_id, name: name, grades: [], average: null };
        cards.push(card);
      }

      card.grades.push(grade); // Afegeix la nota a la targeta
    }

    for (const card of cards) {
      card.average = this.getAverage(card.grades);
    }

    cards.sort((a, b) => a.name.localeCompare(b.name)); // Ordenem les targetes per nom d'assignatura
    return cards;
  }

  // Mètode per calcular la mitjana de les avaluacions d'una assignatura. La mitjana dels percentatges de les seues notes
  private getAverage(grades: GradeWithSubject[]): number | null {
    const percents: number[] = [];

    for (const grade of grades) {
      if (grade.score !== null) {
        percents.push(toPercent(grade.score, grade.max_score));
      }
    }

    return averageOf(percents);
  }

  // Mètode que ens calcula la mitjana general, és a dir, la mitjana aritmètica de les mitjanes de cada matèria
  private getOverall(cards: SubjectCard[]): number | null {
    const averages: number[] = [];

    for (const card of cards) {
      if (card.average !== null) {
        averages.push(card.average);
      }
    }

    return averageOf(averages);
  }

  // Com que l'HTML no pot cridar a funcions importades -> Mètode que ens permet que l'HTML use la funció getLevel(), creada en els utils. És com un envoltori. Classifica una nota segons el percentatge
  levelOf(average: number | null): GradeLevel {
    return getLevel(average);
  }
}
