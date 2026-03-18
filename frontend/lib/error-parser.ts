import axios from "axios";

type ErrorMap = Record<string, unknown>;

export interface ParsedApiError {
  message: string;
  status?: number;
  code?: string;
  isNetworkError: boolean;
}

export class ApiClientError extends Error {
  status?: number;
  code?: string;
  isNetworkError: boolean;

  constructor(parsed: ParsedApiError) {
    super(parsed.message);
    this.name = "ApiClientError";
    this.status = parsed.status;
    this.code = parsed.code;
    this.isNetworkError = parsed.isNetworkError;
  }
}

function pickMessageFromObject(data: ErrorMap): string | undefined {
  const detail = data.detail;
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const joined = detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        if (item && typeof item === "object") {
          const errorObj = item as ErrorMap;
          const msg = typeof errorObj.msg === "string" ? errorObj.msg : "";
          const loc = Array.isArray(errorObj.loc)
            ? (errorObj.loc as unknown[])
                .map((part) => String(part))
                .filter((part) => part !== "body")
                .join(".")
            : "";

          if (loc && msg) {
            return `${loc}: ${msg}`;
          }

          if (msg) {
            return msg;
          }
        }
        return "";
      })
      .filter(Boolean)
      .join("; ");

    if (joined) {
      return joined;
    }
  }

  const candidates = [data.message, data.error, data.title];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  return undefined;
}

export function parseApiError(
  error: unknown,
  fallbackMessage = "Something went wrong. Please try again.",
): ParsedApiError {
  if (error instanceof ApiClientError) {
    return {
      message: error.message,
      status: error.status,
      code: error.code,
      isNetworkError: error.isNetworkError,
    };
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const code = error.code;
    const data = error.response?.data;
    const isNetworkError = code === "ERR_NETWORK" || !error.response;

    if (isNetworkError) {
      return {
        message:
          "Unable to reach the server. Please verify backend URL, CORS, and connection.",
        status,
        code,
        isNetworkError: true,
      };
    }

    if (data && typeof data === "object") {
      const parsed = pickMessageFromObject(data as ErrorMap);
      if (parsed) {
        return { message: parsed, status, code, isNetworkError: false };
      }
    }

    if (status === 401) {
      return {
        message: "Invalid email or password.",
        status,
        code,
        isNetworkError: false,
      };
    }
    if (status === 403) {
      return {
        message: "You are not allowed to perform this action.",
        status,
        code,
        isNetworkError: false,
      };
    }
    if (status === 404) {
      return {
        message: "Requested resource was not found.",
        status,
        code,
        isNetworkError: false,
      };
    }
    if (status === 422) {
      return {
        message: "Invalid input. Please review your data and try again.",
        status,
        code,
        isNetworkError: false,
      };
    }

    return {
      message: fallbackMessage,
      status,
      code,
      isNetworkError: false,
    };
  }

  if (error instanceof Error && error.message.trim()) {
    return {
      message: error.message,
      isNetworkError: false,
    };
  }

  return {
    message: fallbackMessage,
    isNetworkError: false,
  };
}

export function toApiClientError(
  error: unknown,
  fallbackMessage = "Something went wrong. Please try again.",
): ApiClientError {
  return new ApiClientError(parseApiError(error, fallbackMessage));
}
