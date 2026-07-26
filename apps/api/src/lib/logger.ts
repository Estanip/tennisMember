import { Writable } from "node:stream";
import pino, { type Logger, type LoggerOptions } from "pino";

const PINO_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace"] as const;

export type LogLevel = (typeof PINO_LEVELS)[number];

/** Pino numeric levels → emoji (included in JSON and pretty output). */
const LEVEL_EMOJI: Record<number, string> = {
  10: "🔍",
  20: "🐛",
  30: "ℹ️",
  40: "⚠️",
  50: "❌",
  60: "💀",
};

const LEVEL_COLOR: Record<string, string> = {
  trace: "\x1b[90m",
  debug: "\x1b[36m",
  info: "\x1b[32m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  fatal: "\x1b[35m",
};

const RESET = "\x1b[0m";

const PRETTY_IGNORE = new Set([
  "level",
  "time",
  "msg",
  "emoji",
  "service",
  "env",
  "pid",
  "hostname",
]);

let rootLogger: Logger | null = null;

export function resolveLogLevel(): LogLevel {
  const fromEnv = process.env.LOG_LEVEL?.trim().toLowerCase();
  if (fromEnv && (PINO_LEVELS as readonly string[]).includes(fromEnv)) {
    return fromEnv as LogLevel;
  }
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

export function shouldUsePrettyLogs(): boolean {
  const pretty = process.env.LOG_PRETTY?.trim().toLowerCase();
  if (pretty === "true" || pretty === "1") {
    return true;
  }
  if (pretty === "false" || pretty === "0") {
    return false;
  }
  return process.env.NODE_ENV !== "production";
}

function createPrettyDestination(): Writable {
  return new Writable({
    write(chunk, _encoding, callback) {
      try {
        const line = chunk.toString().trim();
        if (!line) {
          callback();
          return;
        }
        const obj = JSON.parse(line) as Record<string, unknown>;
        const level = String(obj.level ?? "info");
        const emoji = typeof obj.emoji === "string" ? obj.emoji : "";
        const msg = typeof obj.msg === "string" ? obj.msg : "";
        const time = typeof obj.time === "string" ? obj.time : "";
        const moduleLabel = typeof obj.module === "string" ? `[${obj.module}] ` : "";
        const color = LEVEL_COLOR[level] ?? "";

        const extras: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
          if (!PRETTY_IGNORE.has(key) && key !== "module") {
            extras[key] = value;
          }
        }
        const extraStr = Object.keys(extras).length > 0 ? ` ${JSON.stringify(extras)}` : "";

        process.stdout.write(
          `${time} ${color}${emoji} ${level.toUpperCase().padEnd(5)}${RESET} ${moduleLabel}${msg}${extraStr}\n`,
        );
      } catch {
        process.stdout.write(chunk);
      }
      callback();
    },
  });
}

/**
 * Structured logger options for Fastify / app code.
 * Production default: JSON lines (Grafana / Better Stack / Elastic).
 * Local default: colored pretty stream with level emoji.
 */
export function buildLoggerOptions(): LoggerOptions {
  return {
    level: resolveLogLevel(),
    base: {
      service: "socios-api",
      env: process.env.NODE_ENV ?? "development",
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label };
      },
    },
    mixin(_mergeObject, levelNum) {
      return { emoji: LEVEL_EMOJI[levelNum] ?? "" };
    },
    redact: {
      paths: [
        "req.headers.authorization",
        'req.headers["x-webhook-secret"]',
        "req.headers.x-webhook-secret",
      ],
      remove: true,
    },
  };
}

export function createRootLogger(): Logger {
  if (rootLogger) {
    return rootLogger;
  }
  const options = buildLoggerOptions();
  rootLogger = shouldUsePrettyLogs() ? pino(options, createPrettyDestination()) : pino(options);
  return rootLogger;
}

/** App-wide logger; optional `module` binding for filtering in log platforms. */
export function getLogger(module?: string): Logger {
  if (!rootLogger) {
    rootLogger = createRootLogger();
  }
  return module ? rootLogger.child({ module }) : rootLogger;
}
