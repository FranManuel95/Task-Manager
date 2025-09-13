// src/types/common.ts

/** Identificadores (puedes especializar por dominio si quieres) */
export type ID = string;

/** ISO 8601 datetime string (ej. "2025-09-13T11:22:33.000Z") */
export type ISODateString = string;

/** Respuesta paginada genérica */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Respuesta de error de API (opcional, por si la usas) */
export interface ApiErrorResponse {
  message: string;
  code?: string | number;
  details?: unknown;
}
