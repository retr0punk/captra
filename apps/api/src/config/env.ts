import * as z from "zod";

const result = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]),
    HOST: z.ipv4(),
    PORT: z.coerce.number(),
    DATABASE_URL: z.url(),
    LOG_LEVEL: z.enum([
      "debug",
      "error",
      "fatal",
      "info",
      "silent",
      "trace",
      "warn",
    ]),
    BASE_URL: z.url(),
    SMTP_HOST: z.hostname(),
    SMTP_USER: z.email(),
    SMTP_PASS: z.string(),
    SMTP_FROM: z.string(),
  })
  .transform((processEnv) => ({
    nodeEnv: processEnv.NODE_ENV,
    host: processEnv.HOST,
    port: processEnv.PORT,
    databaseUrl: processEnv.DATABASE_URL,
    logLevel: processEnv.LOG_LEVEL,
    baseUrl: processEnv.BASE_URL,
    smtp: {
      host: processEnv.SMTP_HOST,
      user: processEnv.SMTP_USER,
      pass: processEnv.SMTP_PASS,
      from: processEnv.SMTP_FROM,
    },
  }))
  .safeParse(process.env);

if (!result.success) {
  throw new Error("Invalid environment variables", {
    cause: z.flattenError(result.error).fieldErrors,
  });
}

export const env = result.data;
