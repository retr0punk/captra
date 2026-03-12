import type { Middleware } from "koa";

export const waitOn: Middleware = (ctx, next) => {
  if (ctx.method === "GET" && ctx.path === "/wait-on") {
    ctx.status = 200;
    return;
  }
  return next();
};
