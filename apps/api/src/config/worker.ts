import { Logger, run, type AddJobFunction, type Runner } from "graphile-worker";
import { fileURLToPath } from "url";
import { pool } from "./database.ts";
import { env } from "./env.ts";
import { logger } from "./logger.ts";

let runnerPromise: Promise<Runner> | undefined;

const getRunner = () =>
  (runnerPromise ??= run({
    pgPool: pool,
    noHandleSignals: true,
    taskList: {},
    crontabFile: fileURLToPath(new URL("../../crontab", import.meta.url)),
    logger: new Logger((scope) => (level, message, meta) => {
      logger[level === "warning" ? "warn" : level]({ scope, meta }, message);
    }),
    concurrency: env.nodeEnv === "production" ? 10 : 2,
  }));

export const addJob: AddJobFunction = async (identifier, payload, spec) =>
  (await getRunner()).addJob(identifier, payload, spec);

export const stopRunner = async () => {
  const maybeRunner = await runnerPromise;
  await maybeRunner?.stop();
};
