import dotenv from "dotenv";
dotenv.config();

export function isProd() {
  return process.env.NODE_ENV === "production";
}

export function fetchConfig() {
  return {
    NODE_ENV: process.env.NODE_ENV!,
    PORT: parseInt(process.env.PORT!) || 4000,
    POSTGRES: process.env.POSTGRES!,
    JWT_SECRET: process.env.JWT_SECRET!,
    TOTP_SECRET: process.env.TOTP_SECRET!,
    SENTRY_DSN: process.env.SENTRY_DSN!,
    JWT: process.env.JWT!,
  };
}

export default fetchConfig();
