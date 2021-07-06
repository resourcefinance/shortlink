import { totp } from "otplib";
import config from "../config";

const options = totp.options;
totp.options = { ...options, step: 300 };

async function generate(): Promise<string> {
  return await totp.generate(config.TOTP_SECRET);
}

async function validate(token: string): Promise<boolean> {
  return await totp.check(token, config.TOTP_SECRET);
}

export { validate, generate };
