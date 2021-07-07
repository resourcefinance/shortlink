import express from "express";
import morgan from "morgan";
import bodyParser from "body-parser";

import { isProd } from "./config";
import { Controller, ControllerDeps } from "./controllers/types";
import { auth } from "./middleware";

export const createServer = (
  dependencies: ControllerDeps,
  ...controllers: Controller[]
): express.Express => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    res.append("Access-Control-Allow-Origin", ["*"]);
    res.append("Access-Control-Allow-Methods", "POST");
    res.append("Access-Control-Allow-Headers", "Content-Type");
    next();
  });
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
