// Amb el següent Servei, ens toca connectar les funcions i models creats, amb Supabase. Es l'intermediari entre SumeliaEdu i la taula grades de Supabase.

import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { // importem els models 
  Grade, // nota de la BBDD que rebem
  GradeData, // Interfície que representa les dades d'una nota que volem enviar a Supabase
  Term, // El tipus que limita a term 1, 2, 3
  GradeWithSubject
} from '../models/database.models';


@Injectable({ 
  providedIn: 'root' 
})

export class GradeService {

  constructor(private supabase: SupabaseService) {}

  // Mètode per recuperar les notes dels alumnes de Supabase, ordenades per nom d'avaluació
  async getGrades(subjectId: string, term: Term) { // passem 2 paràmetres. 1 -> Id de l'assignatura i 2 -> els terms 1, 2 o 3) Així, sol·licitem les notes d'una materia el Term de la qual seria 1, 2 o 3
    const { data, error } = await this.supabase.client // cridem a la BBDD i, per desestructuració, extraiem les següents propietats: data (registres trobats), error (informació si la consulta falla -> null)
      .from('grades') // taula grades
      .select('*')    // totes les columnes de la taula
      .eq('subject_id', subjectId) // cerca els registres la columna dels quals siga subject_id i aquesta siga igual al valor de la variable subjectId (WHERE subject_id = '1234-abcd')
      .eq('term', term) // el term de la nota coincidisca amb el trimestre que rebem per paràmetre
      .order('assessment_name'); // Ordena els resultats

    return { data: data as Grade[] | null, error }; // retorna els resultats, un array d'objectes tipus Grade
  }

  // Mètode que guarda a Supabase les qualificacions que el professor ha introduït o modificat a la pantalla
  async saveGrades(rows: GradeData[]) { // passem el paràmetre rows (files), de tipus GradeData -> cada objecte de l'array representa una fila que volem insertar o actualitzar a la taula grades
    return await this.supabase.client
      .from('grades') // accedim a la taula grades 
      .upsert(rows, { onConflict: 'student_id,subject_id,term,assessment_name' }); // amb .upsert, volem combinar dues operacions: INSERT -> insertar un nou registre i UPDATE -> actualitzar un registre existent. Mitjançant la instrucció onConflict, li diem a Supabase que comprove la combinació d'aquestes 4 columnes. 
  }

    // Mètode per obtenir de Supabase les notes d'un alumne 
  async getChildGrades(studentId: string) {
    const { data, error } = await this.supabase.client // Prepara la consulta a la BBDD
      .from('grades')
      .select('*, subjects(name)') // * -> totes les columnes i el nom de la assignatura relacionada amb cada nota
      .eq('student_id', studentId) // retorna les notes, l'id student del qual coincidisca amb l'id de l'alumne seleccionat
      .not('score', 'is', null) // no retornes registres on score siga null (WHERE score IS NOT NULL). El professor pot desar també cel·les buides
      .order('assessment_name');

    return { data: data as GradeWithSubject[] | null, error };
  }
}
