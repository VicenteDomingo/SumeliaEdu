// Esctructura molt semblant al servei StudentService. La seguretat continua sent part de la base de dades. Les polítiques classes_all_admin i subjects_all_admin sols deixen crear a un admin d'eixa escola. Si un teacher crida a createClass rep una errada de Supabase. Hem de tenir clar que els components no paren directament amb Supabase. Li ho demanen al servei el que necessitem i aquest s'encarrega de la consulta

import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service'; // Importem el servei que ens permet la conexió a la BBDD i ens proporciona l'accés al client
import {
  ClassData,
  Profile,
  SchoolClass,
  Subject,
  SubjectData
} from '../models/database.models';

@Injectable({ 
  providedIn: 'root' 
})

// Volem agrupar en un mateix lloc totes les operacions relacionades amb les classes i les assignatures (consultar classes, mestres, assignatures i creació de classes i assignatures). d'aquesta manera, evitem repetir les consultes a Supabase en cada component. 
export class ClassService {

  constructor(private supabase: SupabaseService) {} // this.supabase

  // Totes les classes (SELECT * FROM classes ORDER BY name;). En aquest article: https://dev.to/gerald-mathew/i-built-a-supabase-style-query-client-that-talks-directly-to-postgres-2m29, i altra docuemtació aprenem a realitzar consultes a la BD en Supabase
  async getClasses() {
    const { data, error } = await this.supabase.client
      .from('classes')
      .select('*')
      .order('name');

    return { data: data as SchoolClass[] | null, error }; // Val a dir que Supabase no sap quina forma tenen les nostres taules. Per aquesta raó, mantenim les interfícies iguals a les taules
  }

  // Els usuaris amb rol teacher. S'usa per als desplegables de tutor i professor. Els dos formularis Create Class i Add Subject, necessiten els professors per als desplegables
  async getTeachers() {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('role', 'teacher') // WHERE role = 'teacher'
      .order('full_name');

    return { data: data as Profile[] | null, error };
  }

  // Totes les assignatures (SELECT * FROM subjects ORDER BY name)
  async getSubjects() {
    const { data, error } = await this.supabase.client
      .from('subjects')
      .select('*')
      .order('name');

    return { data: data as Subject[] | null, error };
  }

  // Creem una classe
  async createClass(schoolClass: ClassData) {
    return await this.supabase.client
    .from('classes')
    .insert(schoolClass);
  }

  // Creem una matèria
  async createSubject(subject: SubjectData) {
    return await this.supabase.client
    .from('subjects')
    .insert(subject);
  }
}
