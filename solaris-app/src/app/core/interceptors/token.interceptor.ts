import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../../shared/services/auth.service';


export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const username = authService.getUser() || '';

  if (token) {
    req = req.clone({
      setHeaders: { 
        Authorization: `${token}`,
        user:  username
      }
    });
  }

  return next(req);
};
