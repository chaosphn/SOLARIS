import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';


export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // ตัวอย่าง role-based
  //const requiredRole = route.data?.['role'];
  //if (requiredRole && !authService.hasRole(requiredRole)) {
  //  router.navigate(['/forbidden']);
  //  return false;
  //}

  return true;
};
