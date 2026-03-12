import pg from "pg";
import { env } from "./env.ts";

export const pool = new pg.Pool({ connectionString: env.databaseUrl });
