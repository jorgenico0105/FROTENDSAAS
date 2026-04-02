import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ERROR_MESSAGES, HttpErrorCode } from '../models';

/**
 * Error Interceptor
 * Handles HTTP errors globally
 * Provides consistent error handling and user feedback
 */
export const errorInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ha ocurrido un error inesperado';

      if (error.error instanceof ErrorEvent) {
        // Client-side error (network, etc.)
        errorMessage = `Error de conexión: ${error.error.message}`;
        console.error('Client Error:', error.error.message);
      } else {
        // Server-side error
        errorMessage = handleServerError(error, router);
      }

      // Log error for debugging
      console.error('HTTP Error:', {
        status: error.status,
        message: errorMessage,
        url: request.url,
        error: error.error
      });

      // TODO: Implementar servicio de notificaciones para mostrar errores al usuario
      // notificationService.showError(errorMessage);

      return throwError(() => ({
        ...error,
        userMessage: errorMessage
      }));
    })
  );
};

/**
 * Handle server-side errors
 */
function handleServerError(error: HttpErrorResponse, router: Router): string {
  let errorMessage = ERROR_MESSAGES[error.status] || 'Error del servidor';

  switch (error.status) {
    case HttpErrorCode.UNAUTHORIZED:
      // 401 - Let auth interceptor handle this
      errorMessage = 'Su sesión ha expirado. Por favor inicie sesión nuevamente.';
      break;

    case HttpErrorCode.FORBIDDEN:
      // 403 - Access denied
      errorMessage = 'No tiene permisos para acceder a este recurso.';
      // Optionally redirect to a forbidden page
      // router.navigate(['/forbidden']);
      break;

    case HttpErrorCode.NOT_FOUND:
      // 404 - Resource not found
      errorMessage = error.error?.message || 'El recurso solicitado no fue encontrado.';
      break;

    case HttpErrorCode.UNPROCESSABLE_ENTITY:
      // 422 - Validation errors
      if (error.error?.error?.details) {
        // Format validation errors
        const validationErrors = formatValidationErrors(error.error.error.details);
        errorMessage = validationErrors;
      } else {
        errorMessage = error.error?.message || 'Los datos proporcionados no son válidos.';
      }
      break;

    case HttpErrorCode.INTERNAL_SERVER_ERROR:
      // 500 - Server error
      errorMessage = 'Error interno del servidor. Por favor intente más tarde.';
      break;

    case HttpErrorCode.SERVICE_UNAVAILABLE:
      // 503 - Service unavailable
      errorMessage = 'El servicio no está disponible. Por favor intente más tarde.';
      break;

    case 0:
      // Network error or CORS
      errorMessage = 'No se pudo conectar con el servidor. Verifique su conexión a internet.';
      break;

    default:
      // Try to get message from error response
      if (error.error?.error?.message) {
        errorMessage = error.error.error.message;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
      break;
  }

  return errorMessage;
}

/**
 * Format validation errors for display
 */
function formatValidationErrors(details: Record<string, string[]>): string {
  const errors: string[] = [];

  Object.entries(details).forEach(([field, messages]) => {
    messages.forEach(message => {
      errors.push(`${capitalizeField(field)}: ${message}`);
    });
  });

  return errors.join('\n');
}

/**
 * Capitalize field name for display
 */
function capitalizeField(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}
