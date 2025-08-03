// types/action-results.ts (or similar shared types file)

export type ActionError = {
  success: false;
  message: string;
  code?: string; // Optional: a specific error code like "USER_NOT_FOUND", "DB_ERROR"
  details?: Record<string, any>; // Optional: for validation errors, etc.
};

export type ActionResult<T> = { success: true; data: T } | ActionError;
