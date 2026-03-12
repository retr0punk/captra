import { httpErrorCode } from "@captra/shared/constants/http-error-code";
import { tryCatch } from "@captra/shared/utils/try-catch";
import { isHttpError, type HttpError } from "http-errors";
import type { Middleware } from "koa";
import { env } from "../../config/env.ts";

const knownProperties = [
  "cause",
  "message",
  "name",
  "stack",
  "status",
  "statusCode",
  "expose",
  "headers",
];

const getOtherProperties = (err: HttpError) =>
  Object.keys(err)
    .filter((key) => !knownProperties.includes(key))
    .reduce(
      (acc, key) => {
        acc[key] = err[key];
        return acc;
      },
      {} as Record<string, unknown>,
    );

export const handleError: Middleware = async (ctx, next) => {
  const [err] = await tryCatch(next());
  if (err) {
    if (ctx.headerSent) {
      ctx.app.emit("error", err, ctx);
      return;
    }
    ctx.res.getHeaderNames().forEach((name) => ctx.res.removeHeader(name));
    if (isHttpError(err)) {
      if (err.headers) ctx.set(err.headers);
      if (err.expose) {
        ctx.status = err.status;
        ctx.body = {
          error: {
            code: err.message,
            ...getOtherProperties(err),
            ...(env.nodeEnv === "development" ? { stack: err.stack } : {}),
          },
        };
        return;
      }
    }
    ctx.app.emit("error", err, ctx);
    ctx.status = 500;
    ctx.body = { error: { code: httpErrorCode[500] } };
  }
};
