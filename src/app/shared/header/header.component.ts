// Creem un header compartit amb el botó Sign out. Té sentit posar-ho a la carpeta shared ja que, repetiriem 3 vegades el mateix codi. Així, ho fem uan sola vegada a SharedModule

import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {

  @Input() roleLabel = ''; // Etiqueta del rol de l'usuari actual (admin, teacher, parent) que es mostrarà al header. Ens permet que el component pare li passe informació, com <app-header roleLabel="Admin">. D'aquesta manera, el mateix header serveix per als 3 roles

  fullName = ''; // Nom complet de l'usuari actual que es mostrarà al header

  constructor(
    private supabase: SupabaseService, 
    private router: Router
  ) {}

  // S'executa en carregar-se el component. Llegeix la sessió, cerca el perfil a profiles i guarda el nom
  async ngOnInit() {
    const { data } = await this.supabase.getSession();
    if (data.session) {
      const { data: profile } = await this.supabase.getProfile(data.session.user.id);
      this.fullName = profile?.full_name ?? ''; // Ho fem per evitar un error. Si profile es null, i ?? posa un text buit si no hi ha nom
    }
  }
  
  // Invalidem la sessió a Supabase i borrem el token del navegador. Després, 
  async logout() {
    await this.supabase.signOut();
    this.router.navigate(['/auth/login']); // redirigim al login. Així combrim el "tancament de sessió"
  }
}
