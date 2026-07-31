import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { BehaviorSubject, catchError, filter, from, switchMap, take, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { HttpService } from '../../shared/services/http.service';
import { AuthRespondModel } from '../../shared/models/auth.model';

/**
 * สถานะการต่ออายุ token ระดับโมดูล — ต้องอยู่นอกฟังก์ชัน interceptor
 * เพราะ interceptor ถูกเรียกใหม่ทุก request แต่ต้องแชร์สถานะกัน
 */
let isRefreshing = false;
/** null = กำลังต่ออายุอยู่ · string = token ใหม่พร้อมใช้ */
const refreshedToken$ = new BehaviorSubject<string | null>(null);

/** endpoint ของระบบ auth เอง — ห้ามพยายามต่ออายุ token ซ้ำ ไม่งั้นวนไม่จบ */
const AUTH_ENDPOINTS = ['refreshtoken', 'authentication', 'checktoken'];

function isAuthEndpoint(url: string): boolean {
  return AUTH_ENDPOINTS.some(path => url.includes(path));
}

/** ใส่ token ล่าสุดกลับเข้า request เดิมก่อนยิงซ้ำ */
function withToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `${token}`,
      user: localStorage.getItem('user') || ''
    }
  });
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const httpService = inject(HttpService);

  const forceLogout = () => {
    isRefreshing = false;
    refreshedToken$.next(null);
    localStorage.clear();
    sessionStorage.clear();
    router.navigate(['/login']);
  };

  const handleAuthError = (error: HttpErrorResponse, request: HttpRequest<unknown>, nextFn: HttpHandlerFn) => {
    const refresh = sessionStorage.getItem('refreshtoken');

    // refresh token หมดอายุด้วย หรือเป็น request ของระบบ auth เอง = ไปต่อไม่ได้แล้ว
    if (!refresh || isAuthEndpoint(request.url)) {
      forceLogout();
      return throwError(() => error);
    }

    // มี request อื่นกำลังต่ออายุอยู่แล้ว — รอ token ใหม่แล้วค่อยยิงซ้ำ
    // ไม่งั้นหน้าที่ยิงหลาย request พร้อมกัน (Realtime/Dashboard) จะเรียก refreshtoken ซ้ำหลายรอบ
    if (isRefreshing) {
      return refreshedToken$.pipe(
        filter((token): token is string => token !== null),
        take(1),
        switchMap(token => nextFn(withToken(request, token)))
      );
    }

    isRefreshing = true;
    refreshedToken$.next(null);

    return from(httpService.refreshtoken(refresh)).pipe(
      switchMap((res: AuthRespondModel | any) => {
        if (!res?.Access?.Token) {
          forceLogout();
          return throwError(() => error);
        }

        const newToken = res.Access.Token;
        localStorage.setItem('token', newToken);
        sessionStorage.setItem('refreshtoken', res.Access.RefreshToken ?? '');
        localStorage.setItem('role', res.Access.Role ?? '');
        localStorage.setItem('pages', JSON.stringify(res.Access.Pages ?? []));
        localStorage.setItem('sites', JSON.stringify(res.Access.Sites ?? []));

        isRefreshing = false;
        refreshedToken$.next(newToken);

        // ยิง request เดิมซ้ำด้วย token ใหม่ ผู้ใช้จึงไม่เห็นข้อมูลหายไปหนึ่งรอบ
        return nextFn(withToken(request, newToken));
      }),
      catchError(() => {
        forceLogout();
        return throwError(() => error);
      })
    );
  };

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {

      if (error.status === 401 || error.status === 403) {
        return handleAuthError(error, req, next);
      } else if (error.status >= 700) {
        router.navigate(['/server-error']);
      }

      return throwError(() => error);
    })
  );
};
