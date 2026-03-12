import { pino, stdTimeFunctions } from "pino";
import { pinoHttp } from "pino-http";
import { env } from "./env.ts";

export const logger = pino({
  level: env.logLevel,
  timestamp: stdTimeFunctions.isoTime,
});

export const httpLogger = pinoHttp({ logger });
