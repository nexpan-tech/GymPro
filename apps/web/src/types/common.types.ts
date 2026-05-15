export type APIStatus = "idle" | "loading" | "success" | "error";

export interface APIResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}