import { sdk } from "./loaders/telemetry.ts";

import closeWithGrace from "close-with-grace";
import { createServer, type Server } from "http";
import { app } from "./app.ts";
import { pool } from "./config/database.ts";
import { env } from "./config/env.ts";
import { logger } from "./config/logger.ts";
import { transporter } from "./config/mailer.ts";
import { stopRunner } from "./config/worker.ts";

let server: Server | undefined;

closeWithGrace({ delay: 30_000, logger }, async ({ err }) => {
  if (err) logger.error(err);
  logger.info("Shutting down gracefully");

  await new Promise<void>((resolve) => {
    if (!server) {
      resolve();
      return;
    }
    server.close((err) => {
      if (err) logger.error(err);
      resolve();
    });
  });

  await stopRunner();
  if (!pool.ended) await pool.end();

  logger.info("Shutdown successful");
  await sdk.shutdown();
});

await transporter.verify();

server = createServer(app.callback())
  .listen(env.port, env.host)
  .on("listening", () => {
    logger.info(`Started listening on ${env.host}:${env.port}`);
  })
  .on("error", (err) => {
    logger.error(err);
    process.exit(1);
  });
