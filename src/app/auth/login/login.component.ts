import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthError } from '@supabase/supabase-js';
import { SupabaseService } from '../../shared/services/supabase.service';
import { LoginCredentials } from '../../shared/models/login-credentials.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  loginForm: FormGroup<{ // Formulari tipat amb FormGroup i FormControl per a un millor control dels valors i validacions
    email: FormControl<string>;
    password: FormControl<string>;
  }>;
  hidePassword = true;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private router: Router
  ) {
    this.loginForm = this.fb.nonNullable.group({
      email: ['', 
        [
          Validators.required, 
          Validators.email
        ]
      ],
      password: ['', 
        [
          Validators.required, 
          Validators.minLength(6)
        ]
      ]
    });
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const credentials: LoginCredentials = this.loginForm.getRawValue();
    const { data, error } = await this.supabase.signIn(
      credentials.email,
      credentials.password
    );

    if (error || !data.user) {
      this.errorMessage = this.isNetworkError(error)
        ? 'Connection problem. Check your internet and try again.'
        : 'Wrong email or password.';
      this.loading = false;
      return;
    }

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
