import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../shared/services/supabase.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  loginForm: FormGroup;
  hidePassword: boolean = true;
  loading: boolean = false;
  errorMessage: string = '';

  constructor (
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;
    const { data, error } = await this.supabase.signIn(email, password);

    if (error || !data.user) {
      this.errorMessage = "Wrong email or password.";
      this.loading = false;
      return;
    }

    const { data: profile, error: profileError } = 
    await this.supabase.getProfile(data.user.id);
    

    if(profileError || !profile) {
      this.errorMessage = 'Your account has no profile. Contact your school administrator.';
      this.loading = false;
      return;
    }

    this.router.navigate(['/' + profile.role, 'dashboard']);
    this.loading = false;
  }
}
