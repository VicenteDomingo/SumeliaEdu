import { 
  Component, 
  EventEmitter, 
  Input, 
  Output 
} from '@angular/core';
import { 
  FormBuilder,
  FormControl, 
  FormGroup, 
  FormGroupDirective, 
  Validators 
} from '@angular/forms';
import { ClassService } from '../../../shared/services/class.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Profile, SubjectData } from '../../../shared/models/database.models';

type SubjectFormControls = {
  name: FormControl<string>;
  code: FormControl<string>;
  teacher_id: FormControl<string>;
};

@Component({
  selector: 'app-subject-form',
  templateUrl: './subject-form.component.html',
  styleUrl: './subject-form.component.scss'
})
export class SubjectFormComponent {
  
  // Les variables
  @Input() classId = '';
  @Input() schoolId = '';
  @Input() teachers: Profile[] = [];

  @Output() created = new EventEmitter<void>();

  subjectForm: FormGroup;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private classService: ClassService,
    private notification: NotificationService
  ) {
    this.subjectForm = this.fb.nonNullable.group({
      name: ['', 
        [
          Validators.required, 
          Validators.minLength(2)
        ]],
      code: [''],
      teacher_id: ['', 
        Validators.required
      ]
    });
  }

  async onSubmit(formDirective: FormGroupDirective) {
    if (this.subjectForm.invalid) {
      this.subjectForm.markAllAsTouched();
      return;
    }

    this.saving = true;

    const value = this.subjectForm.getRawValue();
      const newSubject: SubjectData = {
        school_id: this.schoolId,
        class_id: this.classId,
        teacher_id: value.teacher_id,
        name: value.name,
        code: value.code || null
      };

    const { error } = await this.classService.createSubject(newSubject);
    this.saving = false;

    if (error) {
      this.notification.showError('Could not create the subject. Try again.');
      return;
    }

    this.notification.showSuccess('Subject created.');
    formDirective.resetForm({ name: '', code: '', teacher_id: '' });
    this.created.emit();
  }
}