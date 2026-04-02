/**
 * Generic API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

/**
 * Paginated Response for list endpoints
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Pagination Metadata
 */
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Query Parameters for list requests
 */
export interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, string | number | boolean>;
}

/**
 * API Error Response
 */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    timestamp: string;
    path?: string;
  };
}

/**
 * Validation Error Detail
 */
export interface ValidationError {
  field: string;
  messages: string[];
}

/**
 * HTTP Error Codes
 */
export enum HttpErrorCode {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503
}

/**
 * Common Error Messages
 */
export const ERROR_MESSAGES: Record<number, string> = {
  [HttpErrorCode.BAD_REQUEST]: 'La solicitud no es válida',
  [HttpErrorCode.UNAUTHORIZED]: 'No autorizado. Por favor inicie sesión',
  [HttpErrorCode.FORBIDDEN]: 'No tiene permisos para realizar esta acción',
  [HttpErrorCode.NOT_FOUND]: 'Recurso no encontrado',
  [HttpErrorCode.CONFLICT]: 'Conflicto con el estado actual del recurso',
  [HttpErrorCode.UNPROCESSABLE_ENTITY]: 'Datos de entrada inválidos',
  [HttpErrorCode.INTERNAL_SERVER_ERROR]: 'Error interno del servidor',
  [HttpErrorCode.SERVICE_UNAVAILABLE]: 'Servicio no disponible temporalmente'
};

/**
 * Sort Direction Type
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Generic Delete Response
 */
export interface DeleteResponse {
  success: boolean;
  message: string;
  deletedId: number | string;
}

/**
 * Bulk Operation Response
 */
export interface BulkOperationResponse {
  success: boolean;
  processed: number;
  failed: number;
  errors?: Array<{
    id: number | string;
    error: string;
  }>;
}
