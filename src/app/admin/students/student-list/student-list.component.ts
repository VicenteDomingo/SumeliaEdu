// Mitjançant aquest component volem mostrar l'alumnat d'una escola i permetre que l'admin els cerque, filtre i active/desactive

import { Component, OnInit } from '@angular/core';

// Importem el servei d'alumnat, així no cal que el component escriga directament les consultes SQL o Supabase. 
import { StudentService } from '../../../shared/services/student.service';
import { NotificationService } from '../../../shared/services/notification.service';

// Exportem les interfícies SchoolClass i StudentWithClass
import { SchoolClass, StudentWithClass } from '../../../shared/models/database.models';

@Component({
  selector: 'app-student-list',
  templateUrl: './student-list.component.html',
  styleUrl: './student-list.component.scss'
})

export class StudentListComponent implements OnInit {

  students: StudentWithClass[] = []; // Variable students de tipus array. Comença amb [] -llistat buit- ja que encara no hem rebut alumnat de Supabase
  classes: SchoolClass[] = []; // De forma similar a students, la variable classes emmagatzema un array de classes 
  searchText = ''; // Amb aquesta variable emmagatzemem el que l'usuari escriu al cercador
  selectedClassId = ''; // Variable per guardar l'identificador únic de la classe 
  loading = true; // Variable per indicar si la pantalla està carregant les dades. En acabar de carregar alumnat i classes, passarà a false

  constructor( // Injectem les següents dependències
    private studentService: StudentService, // per consultar i modificar alumnat
    private notification: NotificationService // per mostrar missatges
  ) {}

  // Carreguem l'alumnat i les classes. El mètode ngOnInit s'executa quan Angular inicialitza el component
  async ngOnInit() {
    const studentsResult = await this.studentService.getStudents(); // variable que emmagatzema l'alumnat/o l'error, amb el mètode getStudents del servei studentService
    const classesResult = await this.studentService.getClasses(); // molt semblant a la variable anterior, però aquesta per emmagatzemar les classes que l'usuari té permís per consultar, segons el que haviem establers a les polítiques RLS

    if (studentsResult.error || classesResult.error) {
      this.notification.showError('Could not load the students.');
    } // Comprovem si hi ha errada en mostrar alumnat o (||) classes i mostrem la notificació

    this.students = studentsResult.data ?? []; // Assignem a la variable students el valor que retorna Supabse. Amb ?? (nullish coalescing operator https://medium.com/@nikhil.k_70356/understanding-the-nullish-coalescing-operator-in-javascript-9c78c9c6f59d), diem: Si el valor de l'esquerra es null o undefined, empra el valor de la dreta
    this.classes = classesResult.data ?? [];
    this.loading = false; // Com que ja hem acabat de carregar els resultats, canviem a false
  }

  // Getter per filtrar l'alumnat que compleixen el cercador i el filtre de classe
  get filteredStudents(): StudentWithClass[] {
    return this.students.filter(student => { // Amb .filter, recorrem cada element de la llist i comprovem si es compleix la condició. Recorre tot l'alumnat this.students i nomena student a cada alumno que estigues examinant
      const nameMatches = student.full_name // Comprovem si coincideix el nom
        .toLowerCase()
        .includes(this.searchText.toLowerCase());

      const classMatches = 
        this.selectedClassId === '' || student.class_id === this.selectedClassId; // Comprovem si si coincideix la classe

      return nameMatches && classMatches; // Per a que aparega l'alumne s'han de complir les dues condicions (&&)
    });
  }

  // Amb aquest mètode pretenem rebre el nom complet de l'alumne i retornem les seues inicials. Ho utilitzarem per al cercle
  getInitials(fullName: string): string { // Rebem com a paràmetre el nom complet tipat com a string (text)
    const words = fullName.split(' '); // Amb la funció split dividim el text amb la separació indicada (' ') https://www.w3schools.com/jsref/jsref_split.asp. Per exemple, si es 'Amara Dube', separa amb ['Amara', 'Dube']. Ara la variable words conté una llista amb dos elements

    if (words.length === 1) { // En cas que words tinga un element, retornem la 1a lletra d'eixe element words[0] -> 'Amara'; words[0][0] -> 'A'
      return words[0][0]; 
    }

    return words[0][0] + words[words.length - 1][0]; // Com en el nostre cas words té 2 elements, del 1r element agafem la 'A' i del segon element 'Dube' (words.length - 1), words[1] -> 'Dube' i words[1][0] -> 'D' Primera lletra
  }

  // Mètode per canviar l'estat d'una alumne (Active), sense necessitat d'eliminar-lo de la BBDD. Recordem que, a la taula creada students, l'haviem posat actiu per defecte (active BOOLEAN DEFAULT TRUE)

  async toggleActive(student: StudentWithClass) {
    const action = student.active ? 'deactivate' : 'activate'; // Operador ternari, per activar o desactivar
    const confirmed = confirm('Do you want to ' + action + ' ' + student.full_name + '?'); // Amb la funció del navegador (https://www.w3schools.com/jsref/met_win_confirm.asp), mostrem una finestra flotant al navegador amb dues opcions

    if (!confirmed) { // Si cancel·la, no modifica res
      return;
    }

    const { error } = await this.studentService.setActive(student.id, !student.active); // Cridem al mètode setActive() del servei studentService. 

    if (error) {
      this.notification.showError('Could not update the student.');
      return;
    }

    student.active = !student.active; // Fins ara sols hem canviat l'estat a Supabase. Cal, no obstant, actualitzar-lo a Angular
    this.notification.showSuccess(student.full_name + ' is now ' + (student.active ? 'active' : 'inactive') + '.');
  }
}
