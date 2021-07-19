import express from "express";
import morgan from "morgan";
import cors from "cors";

import { isProd } from "./config";
import { Controller, ControllerDeps } from "./controllers/types";
import { auth } from "./middleware/auth";
import { limitMw, slowMw } from "./middleware";
import { redirect } from "./services/link";
import { log } from "./services";
import helmet from "helmet";

export const createServer = (
  dependencies: ControllerDeps,
  ...controllers: Controller[]
): express.Express => {
  const { prisma } = dependencies;
  const app = express();
  app.use(express.json());
  app.use(cors());

  // cors headers
  app.use(function (req, res, next) {
    res.set("Access-Control-Allow-Origin", "*");
    res.set(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS, PUT, PATCH, DELETE",
    );
    res.set("Access-Control-Allow-Headers", "X-Requested-With,content-type");

    next();
  });

  // rate limiting middleware
  app.use(slowMw);
  app.use(limitMw);

  // auth middleware
  app.use(auth);

  // loggin middleware
  app.use(morgan("dev"));

  // add controllers
  for (const setupController of controllers) {
    const controller = setupController(dependencies);
    app.use(controller.path, controller.router);
  }
  // base redirect route
  app.get("/:id", async (req, res) => {
    const { id } = req.params;

    const { link } = await redirect({ id, prisma });

    if (!link) return res.redirect("https://app.resourcenetwork.co/login");

    return res.redirect(link);
  });

  return app;
};

export const startServer = async ({
  app,
  port,
}: {
  app: express.Express;
  port: number | string;
}) => {
  return app.listen(port, () => {
    log.info(`Server listening on port ${port}`);
  });
};
