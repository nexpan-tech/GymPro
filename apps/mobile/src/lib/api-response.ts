/**
 * api-response — single source of truth for parsing GymPro API responses.
 *
 * The backend is NOT uniform:
 *  - Most routes return an envelope:  { success: true, data: ... }
 *  - A few routes (e.g. /mobile/sync, /mobile/config) return the payload raw.
 *
 * These helpers unwrap the envelope when present and fall back to the raw
 * body otherwise, so callers never have to care which shape they got.
 */

import type { AxiosResponse } from "axios";

type Envelope<T> = { success?: boolean; message?: string; data?: T };
type MaybeEnveloped<T> = Envelope<T> | T;

/** Backend paginated payload shape used by list endpoints. */
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

function body<T>(res: AxiosResponse<MaybeEnveloped<T>>): MaybeEnveloped<T> {
  return res.data;
}

/**
 * Unwrap a single-object response. Returns `data` from the envelope when
 * present, otherwise the raw body.
 */
export function unwrapApiResponse<T>(res: AxiosResponse<MaybeEnveloped<T>>): T {
  const b = body(res) as Envelope<T>;
  if (b && typeof b === "object" && "data" in b && b.data !== undefined) {
    return b.data as T;
  }
  return res.data as T;
}

/**
 * Unwrap a list response. Handles three real backend shapes:
 *   { success, data: [...] }            -> [...]
 *   { success, data: { data: [...] } }  -> [...]  (enveloped pagination)
 *   { data: [...], total, ... }         -> [...]  (raw pagination)
 *   [...]                               -> [...]  (raw array)
 */
export function unwrapListResponse<T>(
  res: AxiosResponse<unknown>,
): T[] {
  const inner = unwrapApiResponse<unknown>(res as AxiosResponse<MaybeEnveloped<unknown>>);

  if (Array.isArray(inner)) {
    return inner as T[];
  }

  if (inner && typeof inner === "object" && Array.isArray((inner as Paginated<T>).data)) {
    return (inner as Paginated<T>).data;
  }

  return [];
}

/**
 * Unwrap a paginated response into a normalized { data, total, page, limit }.
 * Tolerates raw arrays and missing metadata.
 */
export function unwrapPaginatedResponse<T>(
  res: AxiosResponse<unknown>,
): Paginated<T> {
  const inner = unwrapApiResponse<unknown>(res as AxiosResponse<MaybeEnveloped<unknown>>);

  if (Array.isArray(inner)) {
    return { data: inner as T[], total: inner.length, page: 1, limit: inner.length };
  }

  if (inner && typeof inner === "object") {
    const p = inner as Partial<Paginated<T>>;
    const data = Array.isArray(p.data) ? p.data : [];
    return {
      data,
      total: typeof p.total === "number" ? p.total : data.length,
      page: typeof p.page === "number" ? p.page : 1,
      limit: typeof p.limit === "number" ? p.limit : data.length,
    };
  }

  return { data: [], total: 0, page: 1, limit: 0 };
}
