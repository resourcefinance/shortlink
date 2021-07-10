import { APIClient, SendEmailRequest } from "customerio-node/api";
import * as Sentry from "@sentry/node";

import { log } from "./logger";
import config, { isProd } from "../config";
import { shortLink } from "./link";

const customerio = new APIClient(config.CUSTOMERIO_APP_API_KEY);

export async function sendTxEmail(payload: {
  to: string;
  otp: string;
  id: string;
}): Promise<boolean> {
  try {
    const { to, otp, id } = payload;
    const otpParam = "otp=" + otp;
    const emailParam = "email=" + to;
    const originParam = "origin=guardian";
    const urlPath =
      "http://localhost:3000/recover?" +
      otpParam +
      "&" +
      emailParam +
      "&" +
      originParam;

    const link = await shortLink(urlPath);

    const request = new SendEmailRequest({
      to: payload.to,
      transactional_message_id: "13",
      message_data: { otp: link },
      identifiers: {
        id: id,
      },
    });

    await customerio.sendEmail(request);

    return true;
  } catch (e) {
    Sentry.captureException(e);
    log.info("Error sending CIO transactional email: ", e.message);
    log.error(e);
    return false;
  }
}
