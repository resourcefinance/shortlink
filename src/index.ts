import "@sentry/tracing";

import * as Sentry from "@sentry/node";
import { RewriteFrames } from "@sentry/integrations";

import config from "./config";
import { main as controller } from "./controllers/main.controller";
import { createServer, startServer } from "./server";
import { PrismaClient } from ".prisma/client";
import { log } from "./services";

Sentry.init({
  dsn: config.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: config.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new RewriteFrames({
      root: process.cwd(),
    }) as any,
  ],
});

const transaction = Sentry.startTransaction({
  op: "init",
  name: "Server instantiation",
});

const prisma = new PrismaClient();

export const start = () =>
  startServer({
    app: createServer(
      {
        prisma,
      },
      controller
    ),
    port: config.PORT || 80,
  }).catch((e) => {
    transaction.finish();
    log.info("Internal Server Error: ", e.message);
    log.error(e.stack);
  });

start();
