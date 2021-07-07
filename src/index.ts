import { main as controller } from "./controllers/main.controller";
import { createServer, startServer } from "./server";
import { PrismaClient } from ".prisma/client";
import config from "./config";

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
  }).catch((e) => console.log(e));

start();
