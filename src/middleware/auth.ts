import { Request, Response, NextFunction } from "express";

import { log } from "../services";
import { Decoded, verify } from "./jwt";

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization as string;

  try {
    if (header) {
      const token = header.replace("Bearer ", "");

      const decoded = await verify({ token });
      if (!decoded) throw new Error();

      (req as any).user = (decoded as Decoded).id;
      next();
    } else {
      return res
        .status(403)
        .send({ ERROR: true, MESSAGE: "NOT AUTHENTICATED" });
    }
  } catch (e) {
    log.debug("Error decoding jwt: ", e);
    log.error(e);

    return res.status(403).send({ ERROR: true, MESSAGE: "NOT AUTHENTICATED" });
  }
}

export function unless(middleware: any, ...paths: string[]) {
  return function (req: Request, res: Response, next: NextFunction) {
    let pathCheck = true;
    if (req.method !== "GET")
      pathCheck = paths.some((path) => path === req.path);
    pathCheck ? next() : middleware(req, res, next);
  };
}

export const auth = unless(authenticate, "/api/", "/api/create", "/:id");

export const validate = (schema) => async (req, res, next) => {
  const body = req.body;
  try {
    await schema.validate(body);
    next();
  } catch (e) {
    log.debug("Error validating request body schema:");
    log.error(e.message);

    return res
      .status(400)
      .json({ ERROR: true, MESSAGE: "SCHEMA VALIDATION ERROR: " + e.message });
  }
};
