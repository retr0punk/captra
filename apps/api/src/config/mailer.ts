import nodemailer from "nodemailer";
import { env } from "./env.ts";

export const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: 587,
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass,
  },
  pool: true,
  rateLimit: 5,
});
