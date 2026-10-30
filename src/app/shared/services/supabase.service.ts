import { Injectable } from '@angular/core'; // 
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root' // Disponible al nivell de tota l'aplicació sense importar-lo en cap mòdul específic
})
export class SupabaseService {

  private supabase: SupabaseClient; // El client de Supabase -> Permet interactuar amb la base de dades i altres serveis de Supabase. ÉS la nostra conexió amb la base de dades.

  constructor() {
    // Ací creearem la conexió fent ús de les credencials del environment.ts. Aquestes credencials són les que ens permeten connectar-nos amb la nostra base de dades de Supabase.
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  // Mètodes per a la gestió d'autenticació i interacció amb la base de dades

  // Iniciem sessió amb email i password
  signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
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
  async getProfile(userId: string) {
    return this.supabase
      .from('profiles') // taula de perfils de la nostra BBDD
      .select('*')      // seleccionem tots els camps
      .eq('id', userId) // on id = userId (id de l'usuari actual)
      .single();        // esperem un únic resultat 
  }

  // Getter per accedir al client de Supabase des d'altres components o serveis
  get client(): SupabaseClient {
    return this.supabase;
  }
}
