import { httpErrorCode } from "@captra/shared/constants/http-error-code";
import type { RouterContext } from "@koa/router";
import type { Entries } from "type-fest";
import * as z from "zod";

export const validateRequest = async <
  P extends z.Schema | undefined,
  Q extends z.Schema | undefined,
  B extends z.Schema | undefined,
  S extends { params?: P; query?: Q; body?: B },
>(
  ctx: RouterContext,
  schemaMap: S,
) => {
  const result = {} as {
    [K in keyof S]: S[K] extends z.Schema ? z.infer<S[K]> : undefined;
  };

  const source = {
    params: ctx.params,
    query: ctx.query,
    body: ctx.request.body,
  };

  for (const [type, schema] of Object.entries(schemaMap) as Entries<
    typeof schemaMap
  >) {
    if (schema) {
      const parseResult = await schema.safeDecodeAsync(source[type]);
      if (!parseResult.success)
        ctx.throw(422, httpErrorCode[422], {
          ...z.flattenError(parseResult.error),
        });
      result[type] = parseResult.data as any;
    }
  }

  return result;
};
