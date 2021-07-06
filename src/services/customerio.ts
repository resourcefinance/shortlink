import { APIClient, SendEmailRequest } from "customerio-node/api";
import * as Sentry from "sentry";

import { log } from "./logger";
import config, { isProd } from "../config";

export async function sendTxEmail(payload: {
  to: string;
  data: any;
  userId: string;
}) {
  try {
    const client = new APIClient(config.CUSTOMERIO_APP_API_KEY);
    const request = new SendEmailRequest({
      to: payload.to,
      transactional_message_id: isProd() ? "11" : "13",
      message_data: payload.data,
      identifiers: {
        id: payload.userId,
      },
    });
    await client.sendEmail(request);
  } catch (e) {
    Sentry.captureException(e);
    log.error("Error sending CIO transactional email: ", e);
  }
}
