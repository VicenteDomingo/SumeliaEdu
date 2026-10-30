import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

// Guard verifica si l'usuari està loguejat, és a dir, si hi ha una sessió activa. Si no ho està, el redirigeix al login. Aquest guard s'utilitza per protegir rutes que només poden ser accedides per usuaris autenticats.

// En cas que no hi haja sessió activa -> redirigeix al login. En cas que hi haja sessió activa → deixa passar a la ruta protegida.
export const authGuard: CanActivateFn = async (route, state) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const { data } = await supabase.getSession();

  if (data.session) {
    // Si hi ha sessió activa → deixa passar a la ruta protegida
    return true;
  } else {
    // No hi ha sessió activa → redirigeix al login
    router.navigate(['/auth/login']);
    return false;
  }
};
