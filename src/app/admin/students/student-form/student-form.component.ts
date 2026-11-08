import { Component, OnInit } from '@angular/core';
import { 
  FormBuilder, 
  FormGroup, 
  Validators,
  FormControl,
} from '@angular/forms';
import { 
  ActivatedRoute, // Importem la directiva ActivatedRoute. Ens dona informació sobre la ruta actual, com l'ID de l'alumne. https://angular.dev/api/router/ActivatedRoute
  Router 
} from '@angular/router';
import { StudentService } from '../../../shared/services/student.service';
import { SupabaseService } from '../../../shared/services/supabase.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { 
  Profile, 
  SchoolClass, 
  StudentData 
} from '../../../shared/models/database.models';

@Component({
  selector: 'app-student-form',
  templateUrl: './student-form.component.html',
  styleUrl: './student-form.component.scss'
})
export class StudentFormComponent implements OnInit {
  full_name: FormControl;
  class_id: FormControl;
  parent_id: FormControl;
  admission_no: FormControl;
  date_of_birth: FormControl;
  gender: FormControl;
  studentForm: FormGroup; // Variable que representa tot el formulari. https://medium.com/@ingenieroandrade/angular-formcontrol-y-formgroup-32428ebcc651
  classes: SchoolClass[] = []; // Variable per guardar les classes que recuperem de Supabase. Ho tipem amb SchoolClass[] -> la variable contindrà un llistat d'elements del tipus SchoolClass
  parents: Profile[] = [];     // Igual que la variable anterior
  schoolId = '';
  studentId = '';
  isEditMode = false;
  saving = false;

  constructor( // Injecció de les dependències que volem utilitzar
    private fb: FormBuilder, // Per contruir el formulari
    private route: ActivatedRoute, // Per llegir l'ID de la ruut
    private router: Router, // Pel canvi de pàgina
    private studentService: StudentService, // Servei StudentService per consultar, crear i modificar alumnat
    private supabase: SupabaseService, // Per obtenir el perfil i escola de l'administrador
    private notification: NotificationService // Mostrem missatge a l'usuari
  ) {
  
    // Creem els controls individuals
    this.full_name = new FormControl('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(255)
    ]);

    this.class_id = new FormControl('', [
      Validators.required
    ]);

    this.parent_id = new FormControl('');

    this.admission_no = new FormControl('');

    this.date_of_birth = new FormControl('');

    this.gender = new FormControl('');

    // Agrupem tots els controls 
    this.studentForm = this.fb.group({
      full_name: this.full_name,
      class_id: this.class_id,
      parent_id: this.parent_id,
      admission_no: this.admission_no,
      date_of_birth: this.date_of_birth,
      gender: this.gender
    });

  }

  async ngOnInit() {
    // Volem averiguar si estem creant o editant
    const id = this.route.snapshot.paramMap.get('id');
    if (id) { // Si hem trobat un ID a la direcció del navegador...
      this.studentId = id; // guardem l'id de l'alumne
      this.isEditMode = true; // activem el mode edició
    } // En cas de que no existisca un ID, no executem res d'aquest condicional. Seguim, aleshores en mode creació

    // Averiguem a quina escola pertany l'administrador
    const profile = await this.supabase.getCurrentProfile(); // El mètode del servei SupabaseService (1. Existeix una sessió oberta; 2. Recuperem l'id de l'usuari connectat; 3. Cerquem el perfil de la taula profiles; 4. Ens retorna eixe perfil)
    if (profile) {
      this.schoolId = profile.school_id; // Variable que guarda l'school_id de l'usuari connectat (admin)
    }

    // Recuperem ací les classes i els pares per als deplegables del formulari
    const classesResult = await this.studentService.getClasses(); // Variable que accedeix al servei StudentService
    const parentsResult = await this.studentService.getParents(); 
    this.classes = classesResult.data ?? [];
    this.parents = parentsResult.data ?? [];

    // En cas d'estar editant, omplim el formulari amb les dades de l'alumne.
    if (this.isEditMode) {
      await this.loadStudent();
    }
  }

  async loadStudent() {
    const { data: student, error } = await this.studentService.getStudent(this.studentId);

    if (error || !student) {
      this.notification.showError('Student not found.');
      this.router.navigate(['/admin/students']);
      return;
    }

    this.studentForm.patchValue({
      full_name: student.full_name,
      class_id: student.class_id || '',
      parent_id: student.parent_id || '',
      admission_no: student.admission_no || '',
      date_of_birth: student.date_of_birth || '',
      gender: student.gender || ''
    });
  }

  async onSubmit() {
    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      return;
    }

    this.saving = true;

    // Els camps opcionals ('') es guarden com null en la base de dades
    const value = this.studentForm.value;
    const student: StudentData = {
      school_id: this.schoolId,
      class_id: value.class_id,
      parent_id: value.parent_id || null,
      full_name: value.full_name,
      admission_no: value.admission_no || null,
      date_of_birth: value.date_of_birth || null,
      gender: value.gender || null
    };

    let result;
    if (this.isEditMode) {
      result = await this.studentService.updateStudent(this.studentId, student);
    } else {
      result = await this.studentService.createStudent(student);
    }

    if (result.error) {
      this.notification.showError('Could not save the student. Try again.');
      this.saving = false;
      return;
    }

    this.notification.showSuccess('Student saved.');
    this.router.navigate(['/admin/students']);
  }
}
