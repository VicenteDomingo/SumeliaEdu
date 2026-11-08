// Aquest servei contindrà les operacions específiques relacionades amb l'alumnat, les classes i famílies. 

import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  Profile,
  SchoolClass,
  Student,
  StudentData,
  StudentWithClass
} from '../models/database.models';

@Injectable({ 
  providedIn: 'root' 
})

export class StudentService {

  constructor(
    private supabase: SupabaseService // connectem els dos serveis mitjançant la injecció de dependències
  ) {}

  // Mètode per consultar tot l'alumnat d'eixa escola. A més d'obtenir també la seua classe
  async getStudents() {
    const { data, error } = await this.supabase.client // Accedim al client de Supabase mitjançant el getter de SupabaseService
      .from('students')           // taula students
      .select('*, classes(name)') // tots els camps de cada alumne (*), a més del camp 'name' de la taula classes. Ho fem mitjançant una Foreign Key que hem definit prèviament a Supabase (Clau Forània -> https://www.w3schools.com/sql/sql_foreignkey.asp), on relacionem alumnes i classes.
      .order('full_name');

    return { // retorna un array, un llistat
      data: data as StudentWithClass[] | null, error 
    }; 
  }

  // Volem consultar un alumne en concret, per exemple, per omplir el formulari al editar.
  async getStudent(id: string) {
    const { data, error } = await this.supabase.client
      .from('students')
      .select('*')
      .eq('id', id) // cerquem l'alumne el camp id del qual siga igual a l'id que hem rebut com a paràmetre
      .single(); // volem un únic alumne

    return { data: data as Student | null, error }; // retorna un únic alumne
  }

  // Mètode per consultar classes. Ho usem al desplegable i els filtres
  async getClasses() {
    const { data, error } = await this.supabase.client
      .from('classes')
      .select('*')
      .order('name');

    return { data: data as SchoolClass[] | null, error }; // Retorna un llistat de classes, un array d'objectes de tipus SchoolClass
  }

  // Mètode per recuperar els perfils dels usuaris amb el rol parent (associar a un o diversos pares o tutors)
  async getParents() {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('role', 'parent')
      .order('full_name');

    return { data: data as Profile[] | null, error }; // Retorna un llistat de perfils
  }

  // Crear un alumne. Mètode per insertar un alumne nou a la base de dades
  async createStudent(student: StudentData) { // Esperem rebre un objecte amb l'estructura definina a la interfície StudentData 
    return await this.supabase.client
    .from('students')
    .insert(student);
  }

  // Modificar les dades d'un alumne que ja existeix. 
  async updateStudent(id: string, student: StudentData) { // Passem com a paràmetres l'id de l'alumne a modificar i les noves dades de l'alumne
    return await this.supabase.client
    .from('students') // table students
    .update(student)  // update modifica els camps de l'alumne amb els valors de l'objecte student
    .eq('id', id);    // sols volem modificar el registre l'id del cual coincidisca amb el rebut
  }

  // Activar o desactivar un alumno, pero no el borrem. Es conserva el seu historial. El paràmetre active ens dirà si l'alumne està actiu (true) o inactiu (fals)
  async setActive(id: string, active: boolean) {
    return await this.supabase.client
      .from('students')
      .update({ active: active })
      .eq('id', id);
  }
}
