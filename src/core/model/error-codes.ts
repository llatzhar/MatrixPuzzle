export type ErrorCode =
  | "INVALID_INPUT"
  | "UNSAT"
  | "NON_UNIQUE"
  | "GENERATION_FAILED"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export type ErrorResult = {
  status: "error";
  error: {
    code: ErrorCode;
    message: string;
  };
};

export function toErrorResult(code: ErrorCode, message: string): ErrorResult {
  return {
    status: "error",
    error: { code, message }
  };
}
