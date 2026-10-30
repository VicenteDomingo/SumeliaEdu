import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

// Guard per verificar si el rol de l'usuari coincideix amb la ruta
// Per exemple: un teacher no pot accedir a /admin
export const roleGuard = (requiredRole: string): CanActivateFn => {
  return async () => {
    const supabase = inject(SupabaseService);
    const router = inject(Router);

    // Obtenim la sessió activa (si n'hi ha), si l'usuari està loguejat, ens retorna la sessió, si no, ens retorna null
    const { data: sessionData } = await supabase.getSession();

    if (!sessionData.session) {
      router.navigate(['/auth/login']);
      return false;
    }

    // Després busquem el perfil a la taula profiles per llegir el rol
    const { data: profile, error } = await supabase.getProfile(
      sessionData.session.user.id
    );

    if (error || !profile) {
      router.navigate(['/auth/login']);
      return false;
    }

    if (profile.role === requiredRole) {
      // Si el rol coincideix amb el requerit → deixa passar a la ruta protegida
      return true;
    } else {
      // El rol no coincideix -> redirigeix al login 
      router.navigate(['/auth/login']);
      return false;
    }
  };
};
