import { Request, Response, NextFunction } from "express";

import { log } from "../services";
import { Decoded, verify } from "./jwt";

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization as string;

  if (header) {
    const token = header.replace("Bearer ", "");

    const decoded = await verify({ token });
    if (!decoded) throw new Error();

    (req as any).user = (decoded as Decoded).id;
    next();
  } else {
    res.status(401).send({ ERROR: true, MESSAGE: "NOT AUTHENTICATED" });
  }
}

export function unless(middleware: any, ...paths: string[]) {
  return function (req: Request, res: Response, next: NextFunction) {
    const pathCheck = paths.some((path) => path === req.path);
    pathCheck ? next() : middleware(req, res, next);
  };
}

export const auth = unless(authenticate, "/api/", "/api/recover", "/api/reset");

export const validate = (schema) => async (req, res, next) => {
  const body = req.body;
  try {
    await schema.validate(body);
    next();
  } catch (e) {
    log.error(e.message);
    res
      .status(400)
      .json({ ERROR: true, MESSAGE: "SCHEMA VALIDATION ERROR: " + e.message });
  }
};
