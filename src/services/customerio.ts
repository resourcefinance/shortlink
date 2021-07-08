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
}) {
  try {
    const { to, otp, id } = payload;
    const otpParam = "code=" + otp;
    const emailParam = "email=" + to;
    const urlPath =
      "https://app.resourcenetwork.co/recover?" + otpParam + "&" + emailParam;

    const link = await shortLink(urlPath);

    const request = new SendEmailRequest({
      to: payload.to,
      transactional_message_id: isProd() ? "11" : "13",
      message_data: { otp: link },
      identifiers: {
        id: payload.id,
      },
    });

    return await customerio.sendEmail(request);
  } catch (e) {
    Sentry.captureException(e);
    log.info("Error sending CIO transactional email: ", e.message);
    log.error(e);
  }
}
