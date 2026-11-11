// Aquest component, el pare, carrega les dades de quatre taules, les guarda en variables i ofereix funcions auxiliars per a que la vista (HTML) puga mostar-los. També conté als dos formularis fills

import { Component, OnInit } from '@angular/core';
import { ClassService } from '../../../shared/services/class.service'; // Classes, assignatures i professors
import { StudentService } from '../../../shared/services/student.service'; // Alumnat per a comptar-los per classe
import { SupabaseService } from '../../../shared/services/supabase.service'; // De quina escola es l'admin? 
import { NotificationService } from '../../../shared/services/notification.service'; // Mostra avisos d'error
import {
  Profile,
  SchoolClass,
  StudentWithClass,
  Subject
} from '../../../shared/models/database.models'; // Necessitem les següents interfícies per indicar a TypeScript el tipus d'informació que volem emmagatzemaren cada variable

@Component({
  selector: 'app-classes-page',
  templateUrl: './classes-page.component.html',
  styleUrl: './classes-page.component.scss'
})
export class ClassesPageComponent implements OnInit {

  classes: SchoolClass[] = []; // Variable per al llistat de les classes
  subjects: Subject[] = []; // Variable per al llistat de totes les assignatures 
  teachers: Profile[] = []; // Variable per al llistat de professors
  students: StudentWithClass[] = []; // Variable per al llistat d'alumnat
  schoolId = ''; // l'id de l'escola de l'admin. En crear una classe/assignatura caldra indicar a quina escola pertany
  selectedClassId = ''; // l'id de la classe escollida al desplegable
  loading = true; // Mentre carreguem les dades. true, ja que, en obrir la pantalla, encara no hi ha res

  constructor(
    private classService: ClassService,
    private studentService: StudentService,
    private supabase: SupabaseService,
    private notification: NotificationService
  ) {}

  async ngOnInit() {
    
    const profile = await this.supabase.getCurrentProfile(); // Mètode que afegírem a SupabaseService. Llig la sessió i retorna el perfil de l'usuari, o null

    if (profile) { // Si hi ha perfil, guardem l'escola de l'admin
      this.schoolId = profile.school_id;
    }

    await this.loadData(); // Una vegada ya coneixem l'escola de l'admin, carrega totes les llistes
  }

  // Mètode que carrega o regarrega les dades de la pantalla
  async loadData() {
    const classesResult = await this.classService.getClasses();
    const subjectsResult = await this.classService.getSubjects();
    const teachersResult = await this.classService.getTeachers();
    const studentsResult = await this.studentService.getStudents();

    if (
      classesResult.error || 
      subjectsResult.error || 
      teachersResult.error || 
      studentsResult.error
    ) {
      this.notification.showError('Could not load the data.'); // En cas que una consulta vaja bé, el seu error vall null = false. En cas que qualsevol de les 4 tinga un error, el if es compleix i mostrem l'avís roig
    }

    // En aquests casos, ?? significa que si el que hi ha a l'esquerra es null, fa ús d'allò de la dreta, és a dir, si una consulta falla i data és null, guardem un llistat buit, però la resta de dades continuen mostrant-se. 
    this.classes = classesResult.data ?? []; 
    this.subjects = subjectsResult.data ?? [];
    this.teachers = teachersResult.data ?? [];
    this.students = studentsResult.data ?? [];

    // En cas que no hi haja una classe escollida, escollim la primera
    if (this.selectedClassId === '' && this.classes.length > 0) { // Si no hi ha cap classe escollida i (&&) hi ha, al menys una classe...
      this.selectedClassId = this.classes[0].id; // 
    }

    this.loading = false;
  }

  // Funcions de recolzament que crida l'HTML per obtenir les dades ja preparades
  // L'alumnat actiu que té una classe. 
  countStudents(classId: string): number {
    return this.students.filter(student => student.class_id === classId && student.active).length; // Per cada alumne (student) que s'està revisant, ha de ser d'eixa classe i estar actiu
  }

  // Les assignatures que té una classe
  countSubjects(classId: string): number {
    return this.subjects.filter(subject => subject.class_id === classId).length;
  }

  // El nom d'un professor a partir del seu id
  getTeacherName(teacherId: string | null): string {
    if (!teacherId) {
      return 'No teacher';
    }

    const teacher = this.teachers.find(t => t.id === teacherId); // Variable que cerca a la llista el 1r professor l'id del qual coincidiscca. Mentre que  filter() retorna un llistat amb tots els que compleixen, el mètode find() retorna el 1r que compleix.

    if (teacher) { // Si l'ha trobat, retorna el seu nom
      return teacher.full_name;
    }

    return 'Unknown'; // Si no el troba, retorna 'Unknown'
  }

  // Fem aquesta funció auxiliar per formar etiquetes en singular o plural 
  plural(count: number, word: string): string {
    if (count === 1) {
      return count + ' ' + word;
    }

    return count + ' ' + word + 's';
  }

  // Getter per obtenir les assignatures de la classe seleccionada. Les assignatures de la classe escollida al desplegable. Amb el getter, Angular recalcula cada vegada cannvia quelcom. A la vista, en canviar de classe al desplegable de Subjects, el llistat s'actualitza sols
  get subjectsOfSelectedClass(): Subject[] { // Retorna un array d'assignatures
    return this.subjects.filter(subject => subject.class_id === this.selectedClassId);
  }

  // Getter per obtenir les assignatures de la classe seleccionada
  get selectedClassName(): string {
    const selected = this.classes.find(c => c.id === this.selectedClassId); // Amb el mètode .find cerquem a l'array classes la classe l'identificador de la qual coincidisca amb la que tenim guardada a selectedClassid()

    if (selected) { // Si trobem la classe
      return selected.name; // Retornem el seu nom
    }

    return '';
  }
}