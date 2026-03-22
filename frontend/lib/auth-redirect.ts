const AUTH_PATH = "/auth";
const DEFAULT_RETURN_PATH = "/";

export function sanitizeReturnPath(
  returnPath?: string | null,
  fallback: string = DEFAULT_RETURN_PATH,
): string {
  if (!returnPath) {
    return fallback;
  }

  const normalized = returnPath.trim();
  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return fallback;
  }

  if (normalized === AUTH_PATH || normalized.startsWith(`${AUTH_PATH}/`)) {
    return fallback;
  }

  return normalized;
}

export function buildAuthUrl(returnPath?: string | null): string {
  const safeReturnPath = sanitizeReturnPath(returnPath);
  return `${AUTH_PATH}?next=${encodeURIComponent(safeReturnPath)}`;
}

export function getCurrentPathWithSearch(): string {
  if (typeof window === "undefined") {
    return DEFAULT_RETURN_PATH;
  }

  const { pathname, search, hash } = window.location;
  return `${pathname}${search}${hash}`;
}
