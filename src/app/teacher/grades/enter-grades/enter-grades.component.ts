// Mitjançant aquest servei, anem a crear tota la lògica de la pantalla que emprarà el professor/a per registrar les qualificacions

import { Component, OnInit } from '@angular/core';
import { AttendanceService } from '../../../shared/services/attendance.service'; // Servei que conté mètodes com getTeacherSubjects() i getStudentsOfClass(), que anem a reutilitzar. 
import { GradeService } from '../../../shared/services/grade.service';
import { SupabaseService } from '../../../shared/services/supabase.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { // El tipus de dades que usem en cada part del component
  Grade,
  GradeData,
  Student,
  SubjectWithClass,
  Term
} from '../../../shared/models/database.models';
import { // Les funcions auxiliars per calcular i mostrar la mitjana, classificar la nota, convertir en percentatge
  averageOf, 
  getLevel, 
  GradeLevel, 
  toPercent 
} from '../../../shared/utils/grade-utils';
import { TEACHER_NAV } from '../../teacher-nav';

// Interfícies que representen l'estructura de la taula de notes dissenyanda
// Les columnes: nom de l'avaluació i nota màxima
interface Assessment {
  name: string;
  maxScore: number;
}

// Una fila de la tabla: un alumno y su nota en cada evaluación (null = sin nota) Les files: l'alumne (tiups Student -> podem accedir a les propietats), les notes ()
interface GradeRow {
  student: Student;
  scores: Record<string, number | null>; // "Record<K, V> is a TypeScript utility type that describes an object whose keys have the type K and whose values have the type V" https://howtodoinjava.com/typescript/typescript-record/ -> scores funcionarà, aleshores, com un xicotet diccionari. K -> nom de l'avaluació, valor -> nota o null si encara no hi ha
}

@Component({
  selector: 'app-enter-grades',
  templateUrl: './enter-grades.component.html',
  styleUrl: './enter-grades.component.scss'
})
export class EnterGradesComponent implements OnInit {

  navItems = TEACHER_NAV; // desem el menu del teacher
  schoolId = '';          // desem l'id de l'escola (cada nota associada a l'escola)

  subjects: SubjectWithClass[] = [];  // desem les assignatures assignades al teacher
  selectedSubjectId = ''; // desem l'id de la assignatura que el teacher té seleccionada (Supabase en fa us per relacionar les taules)

  term: Term = 1; // desem el trimestre que està consultant el teacher (inicialment, 1)
  terms: Term[] = [1, 2, 3]; // array de trimestres disponibles. terms conté totes les opcions disponibles

  assessments: Assessment[] = []; // desem les avaluacions que tindrà la taula
  rows: GradeRow[] = [];          // desem l'alumnat amb les notes
  // contruïm una taula dinàmica

  // Variables per afegir avaluacions (formulari "Add assessment")
  newName = ''; // desa el nom de la nova avaluació
  newMax = 100; // desa la puntuació màxima de l'avaluació. Iniciat a 100 però el podem canviar

  loading = true; // variable per indicar que estem carregant informació (true)
  saving = false; // variable per indicar que no estem desant res (false)

  constructor(
    private attendanceService: AttendanceService,
    private gradeService: GradeService,
    private supabase: SupabaseService,
    private notification: NotificationService
  ) {}

  async ngOnInit() { // Iniciem la càrrega de dades
    await this.loadSubjects(); // 1r es carreguen les assignatures assignades al professor (primer coneixem les assignatures per seleccionar una)
    await this.loadGrades(); // 2n carreguem : 1. Id de la assignatura seleccionada; 2. Alumnat de la classe; 3. Consulta de notes existents per matèria i trimestre; 4. Preparar files i columnes per a la taula (segon carreguem alumnat i notes d'eixa assignatura)
    this.loading = false; // perquè finalitza la càrregua inicial
  }

  // Getter per obtenir la assignatura escollida. Usa l'id seleccionat per localitzar la matèria corresponent dins de l'array subjects
  get selectedSubject(): SubjectWithClass | undefined { 
    return this.subjects.find(subject => subject.id === this.selectedSubjectId); // amb el mètode find(), retornem la matèria, l'identificador de la qual coincidisca 
  }

  // Mètode per carregar les matèries del teacher. Escollim la primera. Prepara les dades que necessitem per a treballar amb les notes
  private async loadSubjects() {
    const profile = await this.supabase.getCurrentProfile(); // perfil del teacher

    if (!profile) {
      return;
    }

    this.schoolId = profile.school_id; // desem l'id de l'escola des del perfil

    const result = await this.attendanceService.getTeacherSubjects(profile.id); // desem les assignatures del professor

    if (result.error) {
      this.notification.showError('Could not load your subjects.');
    }

    this.subjects = result.data ?? []; // desem les assignatures 

    if (this.subjects.length > 0) { // quantes assignatures tenim?
      this.selectedSubjectId = this.subjects[0].id; // carreguem la 1a[0]
    }
  }

  // Mètode per carregar l'alumnat de la classe i les notes guardades de la matèria i trimestre. Carrega les dades que apareixen a la taula de qualificacions
  async loadGrades() {
    this.assessments = []; // buidem l'array
    this.rows = []; // buidem array també ja que anem a carregar alumnat corresponent a una nova matèria

    const subject = this.selectedSubject; // Obtenim la matèria seleccionada (getter)

    if (!subject) { // Existeix la assignatura?
      return;
    }

    const studentsResult = await this.attendanceService.getStudentsOfClass(subject.class_id); // consultem/desem l'alumnat de la classe
    const gradesResult = await this.gradeService.getGrades(subject.id, this.term); //  consultem/desem les notes existents

    if (studentsResult.error || gradesResult.error) {
      this.notification.showError('Could not load the grades.');
    }

    // Recuperem les dades anteriors
    const students = studentsResult.data ?? [];
    const grades = gradesResult.data ?? [];

    this.assessments = this.buildAssessments(grades); // mètode per construir les columnes
    this.rows = this.buildRows(students, grades); // mètode per construir les files
  }

  // Mètode per construir les columnes d'avaluacions dinàmicament. Una per cada nom d'avaluació diferent. Recorrem les notes guardades i crea una columna per a cada nom diferent. Amb .some() retorna true si "algun" compleix la condició. Si el nom ja exisiteix, no ho repeteix.
  private buildAssessments(grades: Grade[]): Assessment[] {
    const assessments: Assessment[] = [];

    for (const grade of grades) {
      const exists = assessments.some(item => item.name === grade.assessment_name);

      if (!exists) {
        assessments.push({ name: grade.assessment_name, maxScore: grade.max_score });
      }
    }

    return assessments;
  }

  // Mètode per construir les files d'avaluacions dinàmicament, un alumne amb la seua nota a cada columna. Una per cada nom d'avaluació diferent. Per a cada alumne, mirem la columna i cerquem la nota amb .find(). grade ? grade.score : null -> operador ternari: si hi ha fila de nota, la seua puntuació. En cas contrari, null
  private buildRows(students: Student[], grades: Grade[]): GradeRow[] {
    const rows: GradeRow[] = [];

    for (const student of students) {
      const scores: Record<string, number | null> = {};

      for (const assessment of this.assessments) {
        const grade = grades.find(item =>
          item.student_id === student.id && item.assessment_name === assessment.name
        );

        scores[assessment.name] = grade ? grade.score : null;
      }

      rows.push({ student: student, scores: scores });
    }

    return rows;
  }

  // Mètode per canviar a altra matèria
  async onSubjectChange(subjectId: string) {
    this.selectedSubjectId = subjectId;
    await this.loadGrades();
  }

  // Mètode per canviar de trimestre
  async setTerm(term: Term) {
    this.term = term;
    await this.loadGrades();
  }

  // Afegir Avaluacions Noves

  // Mètode per validar una nova avaluació. Comprovem/validem el nom i la nota màxima abans de permetre que el teacher puga afegir una columna a la taula
  private getAssessmentError(name: string, max: number): string {
    if (name.length < 2) {
      return 'The assessment name needs at least 2 characters.';
    }

    if (max <= 0 || max > 999) {
      return 'The maximum score must be between 1 and 999.';
    }

    const repeated = this.assessments.some(item => item.name.toLowerCase() === name.toLowerCase());

    if (repeated) {
      return 'That assessment already exists.';
    }

    return '';
  }

  // Mètode que afegeix una nova avaluació. El seu objectiu es afegir una nova columna a la taula de notes. S'excuta en prémer el botó Add assessment
  addAssessment() {
    const name = this.newName.trim();
    const max = Number(this.newMax);
    const problem = this.getAssessmentError(name, max);

    if (problem !== '') {
      this.notification.showError(problem);
      return;
    }

    this.assessments.push({ name: name, maxScore: max });
    this.assessments.sort((a, b) => a.name.localeCompare(b.name));

    // Tot l'alumnat comença sense nota a la columna nova
    for (const row of this.rows) {
      row.scores[name] = null;
    }

    this.newName = '';
    this.newMax = 100;
  }

  // Mètodes per calcular la mitjana de les notes de l'alumnat. Com que les avaluacions poden tenir puntuacions diferents, cal convertir les notes a percentatges.

  // Mètode per calcular la mitjana de les notes d'un alumne. 
  getRowAverage(row: GradeRow): number | null {
    const percents: number[] = [];

    for (const assessment of this.assessments) {
      const score = row.scores[assessment.name];

      if (score !== null) {
        percents.push(toPercent(score, assessment.maxScore));
      }
    }

    return averageOf(percents);
  }

  // Mètode que converteix la mitjana en un text per mostrar-ho a la interfície
  getRowAverageText(row: GradeRow): string {
    const average = this.getRowAverage(row);

    if (average === null) {
      return '-';
    }

    return average + '%';
  }

  // Mètode senzill per determinar el nivell de l'alumne segons la seua mitjana
  getRowLevel(row: GradeRow): GradeLevel { // sols retornarà 'good' | 'medium' | 'low' | 'none'
    return getLevel(this.getRowAverage(row));
  }

  // Ara cal guardar

  // Mètode que comprova que les notes siguen vàlides. Que cap nota no estiga fora de rango. Retorna el missatge, o '' si tot està bé
  private getScoreError(): string {
    for (const row of this.rows) {
      for (const assessment of this.assessments) {
        const score = row.scores[assessment.name];

        if (score !== null && (score < 0 || score > assessment.maxScore)) {
          return row.student.full_name + ': ' + assessment.name
            + ' must be between 0 and ' + assessment.maxScore + '.';
        }
      }
    }

    return '';
  }

  // Mètode que prepara les dades per a Supabase. Una fila per a cada alumne i avaluació, també les que encara no tenen nota. Transformem el contingut de la nostra taula a la interfície, en un llistat d'objectes que tinga exactament la mateixa estructura de la nostra taula grades 
  private buildGradeData(): GradeData[] {
    const gradeData: GradeData[] = [];

    for (const row of this.rows) {
      for (const assessment of this.assessments) {
        gradeData.push({
          school_id: this.schoolId,
          student_id: row.student.id,
          subject_id: this.selectedSubjectId,
          term: this.term,
          assessment_name: assessment.name,
          score: row.scores[assessment.name],
          max_score: assessment.maxScore
        });
      }
    }

    return gradeData;
  }

  // Mètode que coordina totes les comprobacions, prepara les dades i ho envia a Supabase
  async save() {
    const problem = this.getScoreError();

    if (problem !== '') {
      this.notification.showError(problem);
      return;
    }

    const gradeData = this.buildGradeData();

    if (gradeData.length === 0) {
      this.notification.showError('Add an assessment first.');
      return;
    }

    this.saving = true;
    const { error } = await this.gradeService.saveGrades(gradeData);
    this.saving = false;

    if (error) {
      this.notification.showError('Could not save the grades. Try again.');
      return;
    }

    this.notification.showSuccess('Grades saved.');
  }
}
