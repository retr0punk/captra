export type Ok<T> = readonly [undefined, T];
export type Err<E extends Error> = readonly [E, undefined];
export type Result<E extends Error, T> = Ok<T> | Err<E>;
export declare const ok: <const T>(value: T) => Ok<T>;
export declare const err: <const E extends Error>(error: E) => Err<E>;
export declare const tryCatch: <T>(promise: Promise<T>) => Promise<Result<Error, T>>;
export declare const tryCatchSync: <T>(fn: () => T) => Result<Error, T>;
//# sourceMappingURL=try-catch.d.ts.map