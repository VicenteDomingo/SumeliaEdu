// Amb la creació d'aquest servei pretenem gestionar tot allò relacionat amb l'assistència i comunicar-se amb Supabase

import { Injectable } from '@angular/core'; // "Decorator that marks a class as available to be provided and injected as a dependency." (https://angular.dev/api/core/Injectable)

import { SupabaseService } from './supabase.service'; // Importem la connexió a la nostra base de dades Supabase (SupabaseService -> on centralitzem la connexió amb la base de dades) Cada servei té la seua responsabilitat com hem anat veient.

// SupabaseService -> Gestiona la connexció i autenticació amb Supabase
// AttendanceService -> Gestiona les funcionalitats d'assistència
// StudentService -> Gestiona les operacions d'alumnat
// ClassService -> Gestiona les operacions de classes i matèries

import {
  Attendance,
  AttendanceData,
  Student,
  SubjectWithClass
} from '../models/database.models';

@Injectable ({ 
  providedIn: 'root' 
})

export class AttendanceService {

  constructor(private supabase: SupabaseService ) {} // Al constructor instanciem el servei SupabaseService per connectar-se/comunicar-se amb la BBDD

  // Mètode per obtenir la data actual com a text, en el format de PostgreSQL: "2026-11-12" (https://www.youtube.com/watch?v=LwYwz67l1lA&t=161s)
  getToday(): string {
    const now = new Date();
    // console.log(now)
    const year = now.getFullYear();
    // console.log(year)
    const month = String(now
      .getMonth() + 1) // Com que els mesos compten des de 0, afegim +1 (gener 1, febrer 2...)
      .padStart(2, '0'); // 
    // console.log(month)
    const day = String(now
      .getDate())
      .padStart(2, '0'); // .padStart(2, '0') -> mètode que emplena per l'esquerra fins a tenir 2 caracters. Així, "3" passa a ser "03", ja que PostgreSQL espera 2026-11-03, no 2026-11-3. Aprenem aquest mètode a https://www.youtube.com/watch?v=QhHX6fis7Wc
    // console.log(day)

    return year + '-' + month + '-' + day;
  }

  // Mètode per obtenir de Supabase les matèries que dona un professor/a, junt al nom de la classe a la que pertany la matèria ( Per a mostrar al Dasboard del professor )
  async getTeacherSubjects(teacherId: string) { // Passem com a paràmetre l'id del professor (taula profiles)
    const { data, error } = await this.supabase.client // Com en la resta de mètodes, fem us de la desestructuració per accedir a les dades. Agafem les propietats que ens interessen. https://www.youtube.com/watch?v=UHZcJyVXtLo&t=391s
      .from('subjects') // Taula Supabase on cerquem
      .select('*, classes(name)') // * -> tots els camps de la taula 'subjects', classes(name) -> també el camp name de la taula 'classes'
      .eq('teacher_id', teacherId) // Filtra els resultat. Amb el mètode jQuery .eq, volem únicament les assignatures el professor de les quals coincidisca amb l'id del professor que he rebut. A SQL seria -> WHERE teacher_id = '123456'
      .order('name'); // Ordenem els resultats pel nom de les assignatures. https://supabase.com/docs/reference/javascript/v1/using-modifiers

      // console.log(teacherId) // id del teacher Thabo Sithole

    return { data: data as SubjectWithClass[] | null, error };
  }

  // Mètode per recuperar l'alumnat ACTIU que perteneix a una classe determinada
  async getStudentsOfClass(classId: string) {
    const { data, error } = await this.supabase.client
      .from('students')
      .select('*')
      .eq('class_id', classId)
      .eq('active', true) // Sols volem l'alumnat actiu el camp del qual siga true, ja que a SumeliaEdu pot passar que podem tenir alumnat que ja no està actiu al centre. Les dues condicions s'han de cumplir: WHERE class_id = 'CLASE_4A'AND active = true
      .order('full_name');

      // console.log(classId) // id de la classe a Supabase

    return { data: data as Student[] | null, error };
  }

  // Mètode per consultar els registres d'assistència existents per a una matèria i una data determinada. Volem dos paràmetres: subjectId i date ja que l'assistència està vinculada a una matèria i a una data determinada
  async getAttendance(subjectId: string, date: string) {
    const { data, error } = await this.supabase.client
      .from('attendance') // Taula Supabase per als registres d'assistència
      .select('*')
      .eq('subject_id', subjectId) // Sols volem els registres de la matèria seleccionada
      .eq('date', date); // Filtre per a la data corresponent. Per exemple: WHERE subject_id = 'ASIG_123' AND date = '2026-11-16'

    return { data: data as Attendance[] | null, error };
  }

  // Mètode per consultar l'assistència de varies matèries al mateix temps en una data ( per al dashboard del professor)
  async getAttendanceOfSubjects(subjectIds: string[], date: string) {
    const { data, error } = await this.supabase.client
      .from('attendance')
      .select('*')
      .in('subject_id', subjectIds) // Volem recuperar els registres el subject_id dels quals estiga inclòs dins de l'array subjectIds. Amb llenguatge SQL seria -> WHERE subject_id IN (...), coincideix amb qualsevol id de la llista. https://supabase.com/docs/reference/javascript/using-filters-in
      .eq('date', date);

    return { data: data as Attendance[] | null, error };
  }

  // Mètode per guardar l'assistència de l'alumnat a la taula attedance. Inserim les files noves i actualitzem els registres existents
  async saveAttendance(rows: AttendanceData[]) {
    return await this.supabase.client
      .from('attendance')
      .upsert(rows, { onConflict: 'student_id,subject_id,date' }); // "The term upsert is a portmanteau – a combination of the words “update” and “insert.” In the context of relational databases, an upsert is a database operation that will update an existing row if a specified value already exists in a table, and insert a new row if the specified value doesn’t already exist." -> https://www.cockroachlabs.com/blog/sql-upsert/

      // Amb onConflict volem indicar com identificar el registre que ja existeix (https://supabase.com/docs/reference/javascript/upsert). El conflicte s'ha de comprovar fent us d'aquets 3 camps: sudent_id, subject_id i date. Ens adonem que, per a que aquest codi funcione, apliquem la resctricció UNIQUE a Supabase : -- Un alumne no podrà tenir dos registres per a la mateixa assignatura el mateix dia UNIQUE (student_id, subject_id, date). Si el professor guarda la llista dues vegades, amb 'insert' ens donaria error per duplicat. Amb 'upsert, la segona vegada atualitza. A més, 'rows' és un llistat, guardem tot l'alumnat en una sola petició. 

      // La seguretat segueix a la BBDD: la polítia atendance_all_teacher sols deixa guardar a un teacher d'eixa escola
  }
}
