import { totp } from "otplib";
import config from "../config";
import * as Sentry from "@sentry/node";
import { log } from "./logger";

const options = totp.options;
totp.options = { ...options, step: 300 };

async function generate(): Promise<string> {
  return await totp.generate(config.TOTP_SECRET);
}

async function validate(token: string): Promise<boolean> {
  let valid: boolean;

  try {
    valid = await totp.check(token, config.TOTP_SECRET);
  } catch (e) {
    valid = false;
    log.debug("Error verifying totp:");
    log.error(e);
    Sentry.captureException(e);
  }

  return valid;
}

export { validate, generate };
