// Realitzem aquesta classe filla. No carrega dades pròpies sino que rep del pare la llista de professors i l'escola. Quan acabem de crear la classe, avisem al pare

import { 
  Component, 
  EventEmitter, // Per emetre events cap al component pare -> "In Angular, communication between components is crucial, especially when dealing with parent-child relationships" (https://medium.com/@roshannavale7/understanding-event-emitter-in-angular-0e86679687b3)
  Input, // Directiva que ens permet rebre dades del pare 
  Output // Directiva que ens permet enviar events al pare
} from '@angular/core';
import { 
  FormBuilder, 
  FormControl,
  FormGroup, 
  FormGroupDirective, // Directiva que conecta el formulari reactiu amb la vista. La utilitzem per reiniciar el formulari i el seu estat d'enviament. https://dev.to/aminkarimi_sis/simplifying-form-management-in-angular-with-formgroupdirective-181n
  Validators 
} from '@angular/forms';
import { ClassService } from '../../../shared/services/class.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { ClassData, Profile } from '../../../shared/models/database.models';

type ClassFormControls = {
  name: FormControl<string>;
  tutor_id: FormControl<string>;
};

@Component({
  selector: 'app-class-form',
  templateUrl: './class-form.component.html',
  styleUrl: './class-form.component.scss'
})
export class ClassFormComponent {

  // Dades que li arriben del pare
  @Input() teachers: Profile[] = []; // Rebem del component pare la llista de professors, ja que l'admin haurà de seleccionar el tutor de la classe
  @Input() schoolId = '';

  @Output() created = new EventEmitter<void>(); // Ens permet emetre events personalitzats. https://angular.dev/api/core/EventEmitter

    classForm: FormGroup<ClassFormControls>;
 // variable per al formulari reactiu
  saving = false;

  constructor(
    private fb: FormBuilder,
    private classService: ClassService,
    private notification: NotificationService
  ) {
    this.classForm = this.fb.nonNullable.group({
      name: ['', 
        [
          Validators.required,
          Validators.minLength(2)
        ]],
      tutor_id: ['', 
        Validators.required
      ]
    });
  }

  async onSubmit(formDirective: FormGroupDirective) {
    if (this.classForm.invalid) {
      this.classForm.markAllAsTouched(); // " The markAllAsTouched() method marks the control and all its descendant controls as touched." https://www.concretepage.com/angular/angular-markallastouched
      return;
    }

    this.saving = true;

    const value = this.classForm.getRawValue(); // Variable que recupera el que l'usuari ha escrit: un objecte amb name i tutor_id
    const newClass: ClassData = { // Aquest és l'objecte que enviem a la bbdd Supabase, ja que ens obliga a que estiguen els 4 camps
      school_id: this.schoolId, // L'escola que ve del pare, no de l'usuari
      name: value.name, // Fem ús del nom que ha escrit l'admin
      year: new Date().getFullYear(),
      tutor_id: value.tutor_id // Guardem ací l'identificador del professor seleccionat
    };

    const { error } = await this.classService.createClass(newClass); // Cridem al servei i esperem. De totes les respostes sols volem error i posem saving = false abans, abans de mirar l'error. D'aquesta manera, el botó es desbloqueja tant si ha anat bé com si ha fallat
    this.saving = false;

    if (error) { // Gestionem l'errada
      this.notification.showError('Could not create the class. Try again.');
      return;
    }

    this.notification.showSuccess('Class created.');

    // Reiniciem el formulari i el seu estat. El pare executa loadData() i recarrega les llistes. https://itnext.io/to-reset-a-form-or-to-resetform-555d3da47c52 -> 
    formDirective.resetForm({ name: '', tutor_id: '' });
    this.created.emit();
  }
}

// És important conèixer el fluxe complet: 
// 1. L'Admin emplena el formulari
// 2. Angular comprova les validacions
// 3. Es construeix l'objecte ClassData
// 4. ClassService envia l'objecte a Supabase
// 5. Supabase comprova els permisos i insereix la classe
// 6. El fill mostra el missatge d'èxit i reinicia el formulari
// 7. El fill emet created
// 8. El pare executa loadData() i actualitza la pantalla