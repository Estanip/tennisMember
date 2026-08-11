import { timingSafeEqual } from "node:crypto";

const WEAK_JWT_SECRETS = new Set([
  "",
  "change-me-in-each-environment",
  "local-dev-jwt-secret-change-me",
  "change-me",
  "change-me-production-jwt-secret",
]);

const DEV_JWT_FALLBACK = "local-dev-jwt-secret-change-me";

/** Default access-token lifetime (overridable via `JWT_EXPIRES_IN`). */
export const DEFAULT_JWT_EXPIRES_IN = "12h";

/** Login attempts per IP within the rate-limit window. */
export const LOGIN_RATE_LIMIT_MAX = 10;

export const LOGIN_RATE_LIMIT_WINDOW = "15 minutes";

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

function isWeakJwtSecret(secret: string): boolean {
  if (WEAK_JWT_SECRETS.has(secret)) {
    return true;
  }
  if (secret.length < 32) {
    return true;
  }
  const lower = secret.toLowerCase();
  return lower.includes("change-me") || lower.includes("local-dev");
}

/**
 * Resolves JWT signing secret.
 * In production: required, non-weak, min 32 chars. Dev may fall back to a local default.
 */
export function resolveJwtSecret(): string {
  const fromEnv = process.env.JWT_SECRET?.trim() ?? "";

  if (isProductionRuntime()) {
    if (isWeakJwtSecret(fromEnv)) {
      throw new Error(
        "JWT_SECRET must be set in production to a strong value (min 32 characters, not a placeholder)",
      );
    }
    return fromEnv;
  }

  return fromEnv || DEV_JWT_FALLBACK;
}

export function resolveJwtExpiresIn(): string {
  const fromEnv = process.env.JWT_EXPIRES_IN?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_JWT_EXPIRES_IN;
}

/** Constant-time string compare (length mismatch always returns false). */
export function safeEqualString(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

/** Swagger UI is on by default outside production; set ENABLE_SWAGGER=true to force on in prod. */
export function shouldEnableSwagger(): boolean {
  const flag = process.env.ENABLE_SWAGGER?.trim().toLowerCase();
  if (flag === "true" || flag === "1") {
    return true;
  }
  if (flag === "false" || flag === "0") {
    return false;
  }
  return !isProductionRuntime();
}
