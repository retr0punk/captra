import waitOn from "wait-on";

const host = process.env["HOST"];
if (!host) throw new Error("Environment variable 'HOST' not set");

const port = process.env["PORT"];
if (!port) throw new Error("Environment variable 'PORT' not set");

await waitOn({
  resources: [`http-get://${host}:${port}/wait-on`],
  timeout: 30000,
});
