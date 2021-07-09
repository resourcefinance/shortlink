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

  app.use(
    cors({
      origin: (origin, callback) => {
        // allow requests with no origin
        const whitelist = [
          "http://localhost:3000",
          "https://resourcenetwork.co",
        ];

        if (!origin) return callback(null, true);
        if (whitelist.indexOf(origin) === -1) {
          var message =
            "The CORS policy for this origin does not allow access from the particular origin.";
          return callback(new Error(message), false);
        }
        return callback(null, true);
      },
      allowedHeaders: "X-Requested-With, Content-Type, Authorization",
      methods: "GET, POST, OPTION",
    })
  );

  app.use(express.json());

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
