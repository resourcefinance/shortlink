import express from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import cors from "cors";

import { isProd } from "./config";
import { Controller, ControllerDeps } from "./controllers/types";
import { auth } from "./middleware/auth";
import { limitMw, slowMw } from "./middleware";

export const createServer = (
  dependencies: ControllerDeps,
  ...controllers: Controller[]
): express.Express => {
  const app = express();
  app.use(express.json());
  app.use(cors());

  // cors headers
  app.use(function (req, res, next) {
    res.set("Access-Control-Allow-Origin", "*");
    res.set(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS, PUT, PATCH, DELETE"
    );
    res.set("Access-Control-Allow-Headers", "X-Requested-With,content-type");

    next();
  });

  // rate limiting middleware
  app.use(slowMw);
  app.use(limitMw);

  // auth middleware
  app.use(auth);

  // body parsing for jest tests
  if (!isProd()) {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
  }

  // loggin middleware
  app.use(morgan("dev"));

  // add controllers
  for (const setupController of controllers) {
    const controller = setupController(dependencies);
    app.use(controller.path, controller.router);
  }

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
    console.log(`Server listening on port ${port}`);
  });
};
