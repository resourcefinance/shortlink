import express from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import cors from "cors";

import { isProd } from "./config";
import { Controller, ControllerDeps } from "./controllers/types";
import { auth } from "./middleware";

export const createServer = (
  dependencies: ControllerDeps,
  ...controllers: Controller[]
): express.Express => {
  const app = express();

  app.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS, PUT, PATCH, DELETE"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-Requested-With,content-type"
    );

    next();
  });
  app.use(express.json());

  app.use(cors());

  if (!isProd()) {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
  }

  app.use(morgan("dev"));
  app.use(auth);

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
