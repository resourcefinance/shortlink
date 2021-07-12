import { Router } from "express";
import * as isURL from "isurl";
import { customAlphabet } from "nanoid";
import { lowercase } from "nanoid-dictionary";

import {
  validate as validateSchema,
  createSchema,
  removeSchema,
  reservedSchema,
} from "../middleware";
import { expiresIn } from "./utils/expires";
import { log } from "../services";
import { Controller } from "./types";

const BASE = "https://rsrc.co/";
const nanoid = customAlphabet(lowercase + "0123456789", 6);

export function validateURL(path: string) {
  return isURL.lenient(new URL(path));
}

export const main: Controller = ({ prisma }) => {
  const r = Router();

  // Health check
  r.get("/", (_, res) => {
    return res.status(200).send("OK");
  });

  // CRUD
  r.post("/reserved", validateSchema(reservedSchema), async (req, res) => {
    if (!(req as any).user)
      return res
        .status(403)
        .send({ ERROR: true, MESSAGE: "NOT AUTHENTICATED" });
    const { link, route } = req.body;

    if (!(link && route))
      return res.status(401).send({
        ERROR: true,
        MESSAGE: "BAD REQUEST: PARAMS LINK AND ROUTE REQUIRED",
      });

    try {
      if (!validateURL(link))
        return res.status(401).send({
          ERROR: true,
          MESSAGE: "BAD REQUEST: MALFORMED URL",
        });

      const exists =
        (await prisma.url.findUnique({ where: { id: route } })) ||
        (await prisma.url.findUnique({ where: { original: link } }));

      if (exists) {
        return res.status(200).json({ link: BASE + exists.id });
      }

      const created = await prisma.url.create({
        data: {
          id: route,
          original: link,
        },
      });

      if (!created) {
        return res.status(500).send({
          ERROR: true,
          MESSAGE: "INTERNAL SERVER ERROR: COULD NOT CREATE LINK",
        });
      }

      return res.status(200).json({
        link: BASE + created.id,
      });
    } catch (e) {
      log.debug("Error creating link:");
      log.error(e);

      return res.status(500).send({
        ERROR: true,
        MESSAGE: "INTERNAL SERVER ERROR: " + e,
      });
    }
  });

  r.post("/create", validateSchema(createSchema), async (req, res) => {
    const { link } = req.body;

    if (!link)
      return res.status(401).send({
        ERROR: true,
        MESSAGE: "BAD REQUEST: PARAM LINK REQUIRED",
      });

    try {
      if (!validateURL(link))
        return res.status(401).send({
          ERROR: true,
          MESSAGE: "BAD REQUEST: MALFORMED URL",
        });

      const exists = await prisma.url.findUnique({ where: { original: link } });

      if (exists) {
        return res.status(200).json({ link: BASE + exists.id });
      }

      const id = nanoid();
      const expires = expiresIn();

      const created = await prisma.url.create({
        data: {
          id,
          expires,
          original: link,
        },
      });

      if (!created) {
        return res.status(500).send({
          ERROR: true,
          MESSAGE: "INTERNAL SERVER ERROR: COULD NOT CREATE LINK",
        });
      }

      return res.status(200).json({
        link: BASE + created.id,
      });
    } catch (e) {
      log.debug("Error creating link:");
      log.error(e);

      return res.status(500).send({
        ERROR: true,
        MESSAGE: "INTERNAL SERVER ERROR: " + e,
      });
    }
  });

  r.post("/remove", validateSchema(removeSchema), async (req, res) => {
    if (!(req as any).user)
      return res
        .status(403)
        .send({ ERROR: true, MESSAGE: "NOT AUTHENTICATED" });

    const { id } = req.body;

    if (!id) {
      return res.status(401).send({
        ERROR: true,
        MESSAGE: "BAD REQUEST: ID PARAM REQUIRED",
      });
    }

    try {
      const user = (await prisma.url.findUnique({ where: { id } })) || null;

      if (!user) {
        return res.status(401).send({
          ERROR: true,
          MESSAGE: "INTERNAL SERVER ERROR: COULD NOT FIND URL WITH ID: " + id,
        });
      }

      const resp = await prisma.url.delete({ where: { id: user.id } });

      if (!resp)
        return res.status(401).send({
          ERROR: true,
          MESSAGE: "INTERNAL SERVER ERROR: COULD NOT DELETE URL WITH ID: " + id,
        });

      return res.status(200).send({ deleted: true });
    } catch (e) {
      log.debug("Error removing user:");
      log.error(e);

      return res.status(500).send({
        ERROR: true,
        MESSAGE: "INTERNAL SERVER ERROR: " + e,
      });
    }
  });

  return {
    path: "/api",
    router: r,
  };
};
