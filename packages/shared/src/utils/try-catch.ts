export type Ok<T> = readonly [undefined, T];
export type Err<E extends Error> = readonly [E, undefined];
export type Result<E extends Error, T> = Ok<T> | Err<E>;

export const ok = <const T>(value: T): Ok<T> => [undefined, value];

export const err = <const E extends Error>(error: E): Err<E> => [
  error,
  undefined,
];

export const tryCatch = async <T>(
  promise: Promise<T>,
): Promise<Result<Error, T>> => {
  try {
    return ok(await promise);
  } catch (error) {
    return err(toError(error));
  }
};

export const tryCatchSync = <T>(fn: () => T): Result<Error, T> => {
  try {
    return ok(fn());
  } catch (error) {
    return err(toError(error));
  }
};

const toError = (error: unknown): Error => {
  // NOTE: See https://github.com/nodejs/node/blob/81f6dd66fe9e08875e1c96d65b6bce427cfe8b2d/lib/util.js#L99
  if (
    Object.prototype.toString.call(error) === "[object Error]" ||
    error instanceof Error
  )
    return error as Error;
  try {
    return new Error(`non-error thrown: ${JSON.stringify(error)}`);
  } catch {
    return new Error(`non-error thrown: ${String(error)}`);
  }
};
