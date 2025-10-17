import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';


export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const sites = authService.getSites();
  const pages = authService.getPages()??[];
  const page = route.url[0].path.split('/')[1];

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  //if(pages.includes(page.toLowerCase())){
  //  return true;
  //} else {
  //  router.navigate(['/main/overview']);
  //  return false;
  //}
  

  // ตัวอย่าง role-based
  //const requiredRole = route.data?.['role'];
  //if (requiredRole && !authService.hasRole(requiredRole)) {
  //  router.navigate(['/forbidden']);
  //  return false;
  //}

  return true;
};
