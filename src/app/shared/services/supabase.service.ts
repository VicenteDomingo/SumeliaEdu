// Representa el servei central que gestiona tota la comunicació amb Supabase. Està creat al mòdul shared perquè els tres rols en faran ús (teacher/parent/admin). Llegim aquest article, junt amb altres per realitzar el Getting Started amb la BD: https://medium.com/@mail_99211/getting-started-with-supabase-a-powerful-backend-as-a-service-alternative-d10bcc616eb3

import { Injectable } from '@angular/core'; // 
import { 
  createClient, 
  SupabaseClient, 
  Session, 
} from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Profile } from '../models/database.models';

@Injectable({
  providedIn: 'root' // Disponible al nivell de tota l'aplicació sense importar-lo en cap mòdul específic
})
export class SupabaseService {

  private supabase: SupabaseClient; // El client de Supabase -> Permet interactuar amb la base de dades i altres serveis de Supabase. ÉS la nostra conexió amb la base de dades. "SupabaseClient provides a unified interface for all Supabase operations including database CRUD operations, file storage, and GraphQL queries. It manages HTTP connections, authentication, and request routing automatically." https://docs.rs/supabase_rs/latest/supabase_rs/struct.SupabaseClient.html

  constructor() {
    // Ací creearem la conexió fent ús de les credencials del environment.ts. Aquestes credencials són les que ens permeten connectar-nos amb la nostra base de dades de Supabase i utilitzar-la en tots els mètodes del servei.
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  // Mètodes per a la gestió d'AUTENTICACIÓ i interacció amb la base de dades

  // Iniciem sessió amb email i password. https://nocodehackers.es/blog/supabase-authentication
  signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
  }

  // Tanquem sessió
  signOut() {
    return this.supabase.auth.signOut();
  }

  // Obtenim la sessió activa (si n'hi ha), si l'usuari està loguejat, ens retorna la sessió, si no, ens retorna null
  getSession() {
    return this.supabase.auth.getSession(); 
  }

  // Obtenim l'usuari actual (si n'hi ha), si l'usuari està loguejat, ens retorna l'usuari, si no, ens retorna null
  getUser() {
    return this.supabase.auth.getUser();
  }

  // Ens subscrivim a canvis en l'estat d'autenticació (login, logout, etc.). Escoltem els canvis en la sessió login, logout, token expired...Aquest mètode es clau per als guards de rutes. 
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  // Accés a Dades amb RLS actiu amb Supabase.

  // Obtenim el perfil de l'asuari actual, incloent el seu rol: admin/teacher/parent. 
  // async getProfile(userId: string) {
  //   return this.supabase
  //     .from('profiles') // taula de perfils de la nostra BBDD
  //     .select('*')      // seleccionem tots els camps
  //     .eq('id', userId) // on id = userId (id de l'usuari actual)
  //     .single();        // esperem un únic resultat 
  // }
  async getProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return { data: data as Profile | null, error };
  }

  // El formulari necessita saber de quina escola és el admin, amb la finalitat de guardar l'alumne amb el seu school_id
  // Retorna el perfil de l'usuari que té la sessió oberta.
  async getCurrentProfile() {
    const {data } = await this.getSession(); // Cridem al mètode getSession() per obtenir la sessió actual de l'usuari. Amb desesctructuració, volem sols la propietat data de l'objecte retornat per getSession(). Obtenim l'id únic del'usuari loguejat, si hi ha. 

    if (!data.session) {
      return null;
    }

    const { data: profile } = await this.getProfile(data. session.user.id); // La funció getProfile() rep l'id i consulta la base de dades per recuperar el perfil corresponent. Extrau la propietat data i la guarda en una variable que anomenem profile i que conté el perfil de l'usuari. Retorna eixe perfil amb id, name, role, shool_id
    return profile;
  }

  // Getter per accedir al client de Supabase des d'altres components o serveis
  get client(): SupabaseClient {
    return this.supabase;
  }

  
}
