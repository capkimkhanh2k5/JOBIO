import { AxiosError } from 'axios';
import { toast } from 'sonner';

// ─── DRF Error Shapes ───────────────────────────────────────────────────────

/** DRF validation error — `{ field: ["msg", ...], non_field_errors: [...] }` */
type DRFFieldErrors = Record<string, string[]>;

/** DRF generic error — `{ detail: "..." }` */
interface DRFDetailError {
  detail: string;
}

/** Union of all possible DRF response bodies */
export type DRFErrorBody = DRFFieldErrors | DRFDetailError | string[] | string;

// ─── Parsed result ──────────────────────────────────────────────────────────

export interface ApiError {
  /** A single human-readable message suitable for a toast */
  message: string;
  /** Per-field errors keyed by field name (for react-hook-form `setError`) */
  fieldErrors: Record<string, string>;
  /** HTTP status code (0 for network errors) */
  status: number;
}

// ─── Parser ─────────────────────────────────────────────────────────────────

function isDRFDetailError(data: unknown): data is DRFDetailError {
  return typeof data === 'object' && data !== null && 'detail' in data;
}

/**
 * Parse an Axios error from a DRF backend into a normalised `ApiError`.
 */
export function parseApiError(error: unknown): ApiError {
  // Default
  const result: ApiError = {
    message: 'Đã xảy ra lỗi không xác định.',
    fieldErrors: {},
    status: 0,
  };

  if (!(error instanceof AxiosError) && !(error instanceof Error)) {
    return result;
  }

  // Network / timeout
  if (error instanceof AxiosError && !error.response) {
    result.message = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
    return result;
  }

  if (error instanceof AxiosError && error.response) {
    const { status, data } = error.response;
    result.status = status;

    // ── detail string ───────────────────────────────
    if (isDRFDetailError(data)) {
      result.message = data.detail;
      return result;
    }

    // ── string[] (rare but possible) ────────────────
    if (Array.isArray(data) && data.every((v) => typeof v === 'string')) {
      result.message = data.join(' ');
      return result;
    }

    // ── plain string ────────────────────────────────
    if (typeof data === 'string') {
      result.message = data;
      return result;
    }

    // ── field errors object ─────────────────────────
    if (typeof data === 'object' && data !== null) {
      const body = data as DRFFieldErrors;
      const messages: string[] = [];

      for (const [field, errs] of Object.entries(body)) {
        if (!Array.isArray(errs)) continue;
        const joined = errs.join(' ');
        if (field === 'non_field_errors') {
          messages.unshift(joined); // show first
        } else {
          result.fieldErrors[field] = joined;
          messages.push(`${field}: ${joined}`);
        }
      }

      if (messages.length) {
        result.message = messages[0]; // toast shows the first error
      } else {
        result.message = httpStatusMessage(status);
      }
      return result;
    }

    // ── fallback to status code ─────────────────────
    result.message = httpStatusMessage(status);
    return result;
  }

  // Generic JS Error
  if (error instanceof Error) {
    result.message = error.message;
  }

  return result;
}

// ─── Status code fallbacks ──────────────────────────────────────────────────

function httpStatusMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Dữ liệu gửi lên không hợp lệ.';
    case 401:
      return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
    case 403:
      return 'Bạn không có quyền thực hiện thao tác này.';
    case 404:
      return 'Không tìm thấy tài nguyên yêu cầu.';
    case 409:
      return 'Xung đột dữ liệu. Vui lòng thử lại.';
    case 429:
      return 'Bạn gửi quá nhiều yêu cầu. Vui lòng thử lại sau.';
    case 500:
      return 'Lỗi máy chủ. Vui lòng thử lại sau.';
    default:
      return `Lỗi hệ thống (${status}).`;
  }
}

// ─── Convenience: show a toast for an API error ─────────────────────────────

/**
 * Parse an error and display a sonner toast.
 * Returns the parsed `ApiError` so callers can also use `fieldErrors`.
 */
export function showApiError(error: unknown, fallbackMessage?: string): ApiError {
  const parsed = parseApiError(error);
  toast.error(fallbackMessage ?? parsed.message);
  return parsed;
}

/**
 * Apply DRF field errors to a react-hook-form instance.
 *
 * Usage:
 * ```ts
 * catch (err) {
 *   const { fieldErrors } = parseApiError(err);
 *   applyFieldErrors(form.setError, fieldErrors);
 * }
 * ```
 */
export function applyFieldErrors(
  setError: (name: string, error: { type: string; message: string }) => void,
  fieldErrors: Record<string, string>,
) {
  for (const [field, message] of Object.entries(fieldErrors)) {
    setError(field, { type: 'server', message });
  }
}
