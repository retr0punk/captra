import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { execSync } from "child_process";
import { after, before } from "node:test";
import { pool } from "../src/config/database.ts";

let container: StartedPostgreSqlContainer | undefined;

before(async () => {
  container = await new PostgreSqlContainer("postgres:17")
    .withExposedPorts({ container: 5432, host: 5432 })
    .start();
  execSync("npx graphile-migrate migrate", { stdio: "inherit" });
});

after(async () => {
  await pool.end();
  if (container) await container.stop();
});
