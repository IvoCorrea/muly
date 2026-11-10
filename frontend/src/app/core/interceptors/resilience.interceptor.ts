import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, of, retry, tap, throwError, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ServerStatusService } from '../services/server-status.service';

function isTransientColdStartError(err: unknown): boolean {
  if (!(err instanceof HttpErrorResponse)) return false;
  return err.status === 0 || err.status === 502 || err.status === 503 || err.status === 504;
}

function getCacheKeyForRequest(method: string, urlWithParams: string): string | null {
  if (method !== 'GET') return null;
  if (!urlWithParams.startsWith(environment.apiUrl)) return null;
  const path = urlWithParams.slice(environment.apiUrl.length);

  // Evita cachear endpoints exclusivos de sessão/notificações privadas em tempo real
  if (path.startsWith('/notifications') || path.startsWith('/profile/me') || path.startsWith('/reviews/me')) {
    return null;
  }
  return 'http_' + path;
}

export const resilienceInterceptor: HttpInterceptorFn = (req, next) => {
  const serverStatus = inject(ServerStatusService);
  const isBackendRequest = req.url.startsWith(environment.apiUrl);

  if (!isBackendRequest) {
    return next(req);
  }

  const stopTracking = serverStatus.startTrackingRequest();
  const cacheKey = getCacheKeyForRequest(req.method, req.urlWithParams);
  const isSafeToRetry = req.method === 'GET' || req.method === 'HEAD';

  return next(req).pipe(
    retry({
      count: isSafeToRetry ? 4 : 0,
      delay: (error, retryCount) => {
        if (!isTransientColdStartError(error)) {
          return throwError(() => error);
        }
        serverStatus.notifyRetry();
        return timer(Math.min(3000 * retryCount, 6000));
      }
    }),
    tap((event: HttpEvent<unknown>) => {
      if (cacheKey && event instanceof HttpResponse && event.status === 200 && event.body != null) {
        serverStatus.setCached(cacheKey, event.body);
      }
    }),
    catchError((error: HttpErrorResponse) => {
      if (cacheKey && isTransientColdStartError(error)) {
        const cachedBody = serverStatus.getCached<unknown>(cacheKey);
        if (cachedBody !== null) {
          return of(new HttpResponse({ status: 200, body: cachedBody, url: req.urlWithParams }));
        }
      }
      return throwError(() => error);
    }),
    finalize(() => {
      stopTracking();
    })
  );
};
