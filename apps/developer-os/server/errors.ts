export type ServerErrorCode =
  | "configuration_invalid"
  | "provider_aborted"
  | "provider_invalid_request"
  | "provider_unavailable";

export interface SafeErrorBody {
  error: { code: ServerErrorCode; message: string; details?: readonly string[] };
}

/** An operational error whose public representation never includes its cause. */
export class ServerError extends Error {
  constructor(
    readonly code: ServerErrorCode,
    publicMessage: string,
    readonly details: readonly string[] = [],
    readonly cause?: unknown,
  ) {
    super(publicMessage);
    this.name = "ServerError";
  }

  toSafeBody(): SafeErrorBody {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details.length ? { details: [...this.details] } : {}),
      },
    };
  }
}

export function toSafeErrorBody(error: unknown): SafeErrorBody {
  if (error instanceof ServerError) return error.toSafeBody();
  return {
    error: {
      code: "provider_unavailable",
      message: "The server could not complete the request.",
    },
  };
}
