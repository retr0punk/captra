import { httpErrorCode } from "@captra/shared/constants/http-error-code";
import { bodyParser } from "@koa/bodyparser";
import cors from "@koa/cors";
import Koa from "koa";
import helmet from "koa-helmet";
import { env } from "./config/env.ts";
import { httpLogger, logger } from "./config/logger.ts";
import { handleError } from "./shared/middleware/error-handler.ts";
import { waitOn } from "./shared/middleware/wait-on.ts";

export const app = new Koa({ proxy: true });

app.on(
  "error",
  (
    err: Error,
    ctx: typeof app extends Koa<infer S, infer C>
      ? Koa.ParameterizedContext<S, C> | undefined
      : never,
  ) => {
    (ctx?.req.log ?? logger).error(err);
  },
);

if (env.nodeEnv === "development") app.use(waitOn);

app
  .use(handleError)
  .use((ctx, next) => {
    httpLogger(ctx.req, ctx.res);
    return next();
  })
  .use(helmet())
  .use(
    cors({
      origin: env.baseUrl,
      credentials: true,
    }),
  )
  .use(
    bodyParser({
      onError: (err, ctx) => {
        ctx.throw(400, httpErrorCode[400], { cause: err });
      },
    }),
  );
