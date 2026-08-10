export type ServerErrorCode =
  | "configuration_invalid"
  | "provider_aborted"
  | "provider_invalid_request"
  | "provider_unavailable"
  | "INVALID_JSON"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "VALIDATION_FAILED"
  | "ORIGIN_NOT_ALLOWED"
  | "NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "REQUEST_TIMEOUT"
  | "INTERNAL_ERROR";

export interface SafeErrorBody {
  error: { code: ServerErrorCode; message: string; details?: readonly string[] };
  requestId?: string;
}

/** An operational error whose public representation never includes its cause. */
export class ServerError extends Error {
  constructor(readonly code: ServerErrorCode, publicMessage: string, readonly details: readonly string[] = [], readonly cause?: unknown) {
    super(publicMessage);
    this.name = "ServerError";
  }

  toSafeBody(requestId?: string): SafeErrorBody {
    return {
      error: { code: this.code, message: this.message, ...(this.details.length ? { details: [...this.details] } : {}) },
      ...(requestId ? { requestId } : {}),
    };
  }
}

export function toSafeErrorBody(error: unknown, requestId?: string): SafeErrorBody {
  if (error instanceof ServerError) return error.toSafeBody(requestId);
  return {
    error: { code: requestId ? "INTERNAL_ERROR" : "provider_unavailable", message: "The server could not complete the request." },
    ...(requestId ? { requestId } : {}),
  };
}
