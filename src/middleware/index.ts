import { Request, Response, NextFunction } from "express";

import { verifyToken } from "../controllers/utils/auth.utils";
import { log } from "../services";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization as string;

  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");

    const user = verifyToken(token) as {
      id: string;
      email: string;
    };

    (req as any).user = user;
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

export const auth = unless(
  authenticate,
  "/api/",
  "/api/token",
  "/api/register"
);

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
