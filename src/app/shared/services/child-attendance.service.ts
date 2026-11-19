// Cal connectar el dashboard de les famílies amb la taula attendance de la nostra base de dades Supabase. Obtenim els registres d'assistència de tots els fills d'una família, a partir del dilluns de la setmana actual

import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AttendanceWithSubject } from '../models/database.models';

@Injectable({ 
  providedIn: 'root' 
})
export class ChildAttendanceService {

  constructor(private supabase: SupabaseService) {}

  // La asistencia de varios alumnos desde una fecha en adelante Mètode que s'encarrega de consultar la BBDD. Rep dos paràmetres: studentsIds -> llistat d'identificadors (família pot tenir més d'un fill) i data en format string
  async getAttendance(studentIds: string[], fromDate: string) {
    // Construïm la petició 
    const { data, error } = await this.supabase.client
      .from('attendance') 
      .select('*, subjects(name)') // volem tots els camps de la taula attendance (*), a més del camp name de subjects (relació amb subject_id)
      .in('student_id', studentIds) // filtrem -> WHERE student_id IN (...)
      .gte('date', fromDate) // greater than or equal. Filtrem per data -> AND date >= ... (greater than or equal, mayor o igual)
      .order('date', { ascending: false }); // allò més recent, primer

    return { data: data as AttendanceWithSubject[] | null, error };
  }
}
