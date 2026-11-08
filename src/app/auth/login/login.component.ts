import { Component } from '@angular/core';
import { 
  FormBuilder, // Seria el "constructor de formularis" d'Angular. Ens permet crear formularis reactius amb FormGroup i FormControl
  FormControl, 
  FormGroup, 
  Validators 
} from '@angular/forms';
import { Router } from '@angular/router'; // Router és una ferramenta d'Angular que ens permet navegar entre diferents rutes de l'aplicació. Per a canviar de pantalla des del codi.
import { AuthError } from '@supabase/supabase-js'; // El tipus d'error que retorna Supabase quan hi ha un problema d'autenticació
import { SupabaseService } from '../../shared/services/supabase.service'; // El servei que hem creat per a interactuar amb Supabase. Ens permet fer login, logout, obtenir el perfil de l'usuari, etc.
import { LoginCredentials } from '../../shared/models/login-credentials.model'; // Descriu les credencials de login (email i password) que s'envien a Supabase per a autenticar l'usuari

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})

export class LoginComponent {

  loginForm: FormGroup<{ // Variable que guarda el formulari amb els seus dos camps. Ho trobem a la vista login.component.html amb [formGroup]="loginForm"
    email: FormControl<string>;
    password: FormControl<string>;
  }>;
  hidePassword = true; // Variable per al botó de l'ull. Amb true, el password està amagat. Amb false, el password es mostra en text pla. Ho trobem a la vista login.component.html amb [type]="hidePassword ? 'password' : 'text'"
  loading = false; // Mentre esperem a Supabase, serà true. 
  errorMessage = ''; // Variable per guardar el missatge d'error. Ho trobem a la vista amb @if (errorMessage) 

  constructor( // Injecció de dependències al constructor. Ens permet utilitzar els serveis de FormBuilder, SupabaseService i Router dins d'aquest component.
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private router: Router
  ) {
    this.loginForm = this.fb.nonNullable.group({ // Guardem el formulari a la variable. Amb nonNullable.group, els valors del formulari no poden ser null. Els valors inicials són '' (cadena buida) i els validators són required i email per al camp email, i required i minLength(6) per al camp password.
      email: ['', 
        [
          Validators.required, 
          Validators.email
        ]
      ],
      password: ['', 
        [
          Validators.required, 
          Validators.minLength(6),
          Validators.maxLength(16)
        ]
      ]
    });
  }

  async onSubmit() {
    if (this.loginForm.invalid) { // En cas que el formulari siga invàlid, marca els camps com a tocats. return -> ix de la funció sense fer res més i es mostren els errors de validació a la vista. 
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true; // Mostra el spinner de càrrega a la vista. Es bloqueja el botó
    this.errorMessage = ''; // Borra qualsevol missatge d'errada anterior 

    const credentials: LoginCredentials = this.loginForm.getRawValue(); // Constant del tipus LoginCredentials. Guarda email i password. 
    const { data, error } = await this.supabase.signIn(
      credentials.email,
      credentials.password
    ); // Cridem al servei de Supabase per a fer login amb les credencials. data conté la informació de l'usuari si el login és correcte. error conté l'error si el login falla.

    if (error || !data.user) { // Si hi ha errada o no hi ha usuari...
      this.errorMessage = this.isNetworkError(error)
        ? 'Connection problem. Check your internet and try again.'
        : 'Wrong email or password.';
      this.loading = false;
      return;
    }

    // Després de saber que la constrasenya i email són correctes, cal comprovar el rol de l'usuari. Com que data i error ja existeixen, les guardem data: profile i error: profileError. No poden existir dues variables amb el mateix nom dins d'una mateixa funció. 
    const { data: profile, error: profileError } =
      await this.supabase.getProfile(data.user.id);

    if (profileError || !profile) {
      this.errorMessage = 'Your account has no profile. Contact your school administrator.';
      await this.supabase.signOut(); // Fa un Log out de l'usuari si no es troba cap perfil
      this.loading = false;
      return;
    }

    this.router.navigate(['/' + profile.role, 'dashboard']);
    this.loading = false;
  }

  private isNetworkError(error: AuthError | null): boolean {
    return !!error && (error.status === 0 || error.name === 'AuthRetryableFetchError');
  }
}
