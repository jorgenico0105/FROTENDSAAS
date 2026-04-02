import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse, QueryParams } from '../models';

/**
 * Request Options Interface
 */
export interface RequestOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | number | boolean | (string | number | boolean)[] };
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  withCredentials?: boolean;
}

/**
 * API Service
 * Base HTTP service for making API requests
 * Provides typed methods for CRUD operations
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl: string;

  constructor(private http: HttpClient) {
    this.baseUrl = environment.apiUrl;
  }

  /**
   * Build full URL from endpoint
   */
  private buildUrl(endpoint: string): string {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.baseUrl}/${cleanEndpoint}`;
  }

  /**
   * Build HttpParams from QueryParams
   */
  private buildParams(queryParams?: QueryParams): HttpParams {
    let params = new HttpParams();

    if (!queryParams) {
      return params;
    }

    if (queryParams.page !== undefined) {
      params = params.set('page', queryParams.page.toString());
    }
    if (queryParams.limit !== undefined) {
      params = params.set('limit', queryParams.limit.toString());
    }
    if (queryParams.sortBy) {
      params = params.set('sortBy', queryParams.sortBy);
    }
    if (queryParams.sortOrder) {
      params = params.set('sortOrder', queryParams.sortOrder);
    }
    if (queryParams.search) {
      params = params.set('search', queryParams.search);
    }
    if (queryParams.filters) {
      Object.entries(queryParams.filters).forEach(([key, value]) => {
        params = params.set(key, String(value));
      });
    }

    return params;
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error?.error?.message) {
        errorMessage = error.error.error.message;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Error ${error.status}: ${error.statusText}`;
      }
    }

    console.error('API Error:', errorMessage, error);
    return throwError(() => error);
  }

  /**
   * GET request
   * @param endpoint - API endpoint
   * @param options - Request options
   * @returns Observable of response type T
   */
  get<T>(endpoint: string, options?: RequestOptions): Observable<T> {
    return this.http.get<T>(this.buildUrl(endpoint), options as object).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * GET request with query parameters
   * @param endpoint - API endpoint
   * @param queryParams - Query parameters
   * @returns Observable of response type T
   */
  getWithParams<T>(endpoint: string, queryParams?: QueryParams): Observable<T> {
    const params = this.buildParams(queryParams);
    return this.get<T>(endpoint, { params });
  }

  /**
   * GET paginated list
   * @param endpoint - API endpoint
   * @param queryParams - Query parameters
   * @returns Observable of PaginatedResponse
   */
  getList<T>(endpoint: string, queryParams?: QueryParams): Observable<PaginatedResponse<T>> {
    return this.getWithParams<PaginatedResponse<T>>(endpoint, queryParams);
  }

  /**
   * GET single item by ID
   * @param endpoint - API endpoint
   * @param id - Item ID
   * @returns Observable of response type T
   */
  getById<T>(endpoint: string, id: number | string): Observable<T> {
    return this.get<T>(`${endpoint}/${id}`);
  }

  /**
   * POST request
   * @param endpoint - API endpoint
   * @param body - Request body
   * @param options - Request options
   * @returns Observable of response type T
   */
  post<T>(endpoint: string, body: unknown, options?: RequestOptions): Observable<T> {
    return this.http.post<T>(this.buildUrl(endpoint), body, options as object).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * PUT request
   * @param endpoint - API endpoint
   * @param body - Request body
   * @param options - Request options
   * @returns Observable of response type T
   */
  put<T>(endpoint: string, body: unknown, options?: RequestOptions): Observable<T> {
    return this.http.put<T>(this.buildUrl(endpoint), body, options as object).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * PATCH request
   * @param endpoint - API endpoint
   * @param body - Request body
   * @param options - Request options
   * @returns Observable of response type T
   */
  patch<T>(endpoint: string, body: unknown, options?: RequestOptions): Observable<T> {
    return this.http.patch<T>(this.buildUrl(endpoint), body, options as object).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * DELETE request
   * @param endpoint - API endpoint
   * @param options - Request options
   * @returns Observable of response type T
   */
  delete<T>(endpoint: string, options?: RequestOptions): Observable<T> {
    return this.http.delete<T>(this.buildUrl(endpoint), options as object).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * DELETE by ID
   * @param endpoint - API endpoint
   * @param id - Item ID
   * @returns Observable of void
   */
  deleteById(endpoint: string, id: number | string): Observable<void> {
    return this.delete<void>(`${endpoint}/${id}`);
  }

  /**
   * Upload file
   * @param endpoint - API endpoint
   * @param file - File to upload
   * @param fieldName - Form field name for the file
   * @param additionalData - Additional form data
   * @returns Observable of response type T
   */
  uploadFile<T>(
    endpoint: string,
    file: File,
    fieldName: string = 'file',
    additionalData?: Record<string, string>
  ): Observable<T> {
    const formData = new FormData();
    formData.append(fieldName, file, file.name);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.post<T>(endpoint, formData);
  }

  /**
   * Download file
   * @param endpoint - API endpoint
   * @returns Observable of Blob
   */
  downloadFile(endpoint: string): Observable<Blob> {
    return this.http.get(this.buildUrl(endpoint), {
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }
}
