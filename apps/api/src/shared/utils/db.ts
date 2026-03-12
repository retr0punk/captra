import pg from "pg";
import { pool } from "../../config/database.ts";

export const isUniqueViolation = (err: unknown): err is pg.DatabaseError =>
  err instanceof pg.DatabaseError && err.code === "23505";

export const withTransaction = async <T>(
  callback: (client: pg.PoolClient) => Promise<T>,
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const defineRepoFn = <I extends any = undefined, O = any>(
  fn: (db: pg.PoolClient | pg.Pool, input: I) => Promise<O>,
) => {
  type E = (...arg: I extends undefined ? [] : [I]) => Promise<O>;
  return {
    exec: ((...arg) => fn(pool, arg[0] as I)) as E,
    withClient: (client: pg.PoolClient) => ({
      exec: ((...arg) => fn(client, arg[0] as I)) as E,
    }),
  };
};

export const defineRepoInsertFn = <
  I extends Record<string, any>,
  O extends Record<string, any>,
>(
  tableName: string,
) =>
  defineRepoFn(async (db, input: I) => {
    const { fields, params, placeholders } = Object.entries(input).reduce(
      (acc, [k, v]) => {
        if (v !== undefined) {
          acc.fields.push(pg.escapeIdentifier(k));
          acc.params.push(v);
          acc.placeholders.push(`$${acc.fields.length}`);
        }
        return acc;
      },
      {
        fields: [] as string[],
        params: [] as any[],
        placeholders: [] as string[],
      },
    );
    if (fields.length === 0)
      throw new Error("Cannot create record with no defined values");
    const result = await db.query<O>(
      `INSERT INTO ${pg.escapeIdentifier(tableName)} (${fields.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`,
      params,
    );
    return result.rows[0]!;
  });

export const getUpdateQuerySetsAndParams = (obj: Record<string, any>) =>
  Object.entries(obj).reduce(
    (acc, [k, v]) => {
      if (v !== undefined) {
        acc.sets.push(`${pg.escapeIdentifier(k)} = $${acc.sets.length + 1}`);
        acc.params.push(v);
      }
      return acc;
    },
    {
      sets: [] as string[],
      params: [] as any[],
    },
  );

export const defineRepoUpdateByIdFn = <
  I extends Record<string, any>,
  O extends Record<string, any>,
>(
  tableName: string,
  idColumn: keyof I & string,
) =>
  defineRepoFn(async (db, input: I) => {
    const { [idColumn]: idColumnValue, ...rest } = input;
    const { sets, params } = getUpdateQuerySetsAndParams(rest);
    params.push(idColumnValue);
    if (sets.length === 0) return;
    const result = await db.query<O>(
      `UPDATE ${pg.escapeIdentifier(tableName)} SET ${sets.join(", ")} WHERE ${pg.escapeIdentifier(idColumn)} = $${params.length} RETURNING *`,
      params,
    );
    return result.rows[0];
  });
