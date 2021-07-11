import { User } from "@prisma/client";
import { Router } from "express";
import { retry, retryAsyncUntilTruthy } from "ts-retry";

import { validate as validateSchema } from "../middleware";
import {
  generate,
  validate as validateTotp,
  log,
  replaceMultiSigOwner,
  getGuardianAddr,
  sendTxEmail,
} from "../services";
import {
  recoverSchema,
  registerSchema,
  resetSchema,
  removeAndFetchSchema,
  updateSchema,
} from "./schema";
import { Controller } from "./types";

export const main: Controller = ({ prisma }) => {
  const r = Router();

  // GET
  r.get("/", (_, res) => {
    return res.status(200).send("OK");
  });

  r.get("/user", validateSchema(removeAndFetchSchema), async (req, res) => {
    if (!(req as any).user)
      return res
        .status(403)
        .send({ ERROR: true, MESSAGE: "NOT AUTHENTICATED" });

    const { userId } = req.body;

    if (!userId) {
      return res.status(401).send({
        ERROR: true,
        MESSAGE: "NOT FOUND: PARAMS DATA AND USER ID REQUIRED",
      });
    }

    try {
      const user =
        (await prisma.user.findUnique({ where: { userId } })) || null;

      if (!user) {
        return res.status(401).send({
          ERROR: true,
          MESSAGE: "NOT FOUND: COULD NOT FIND USER WITH USER ID: " + userId,
        });
      }

      return res.status(200).json({ user });
    } catch (e) {
      log.debug("Error updating user:");
      log.error(e);

      return res.status(500).send({
        ERROR: true,
        MESSAGE: "INTERNAL SERVER ERROR: " + e,
      });
    }
  });

  // POSTS
  r.post("/register", validateSchema(registerSchema), async (req, res) => {
    if (!(req as any).user)
      return res
        .status(403)
        .send({ ERROR: true, MESSAGE: "NOT AUTHENTICATED" });

    const { userId, email, multiSigAddress, clientAddress } = req.body;
    if (!(userId && email))
      return res.status(401).send({
        ERROR: true,
        MESSAGE: "BAD REQUEST: PARAMS USER ID AND EMAIL REQUIRED",
      });

    try {
      const exists =
        (await prisma.user.count({ where: { userId } })) ||
        (await prisma.user.count({ where: { email } }));

      if (exists) {
        return res
          .status(400)
          .send({ ERROR: true, MESSAGE: "USER WITH EMAIL OR USERID EXISTS" });
      }

      const validateEmailToken = await generate();

      const user = await prisma.user.create({
        data: {
          userId,
          email,
          validateEmailToken,
          multiSigAddress: multiSigAddress || null,
          clientAddress: clientAddress || null,
        },
      });

      if (!user) {
        return res.status(500).send({
          ERROR: true,
          MESSAGE: "INTERNAL SERVER ERROR: COULD NOT CREATE USER",
        });
      }

      const guardian = await getGuardianAddr();

      return res.status(200).json({
        user,
        guardian,
      });
    } catch (e) {
      log.debug("Error registering user:");
      log.error(e);

      return res.status(500).send({
        ERROR: true,
        MESSAGE: "INTERNAL SERVER ERROR: " + e,
      });
    }
  });

  r.post("/reset", validateSchema(resetSchema), async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(401).send({
        ERROR: true,
        MESSAGE: "INTERNAL SERVER ERROR: EMAIL PARAM REQUIRED",
      });
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return res.status(401).send({
          ERROR: true,
          MESSAGE: "NOT FOUND: COULD NOT FIND USER WITH EMAIL: " + email,
        });
      }

      const payload = {
        otp: user.validateEmailToken,
        to: user.email,
        id: user.userId,
      };

      const resp: boolean = await sendTxEmail(payload as any);

      if (!resp) {
        await retryAsyncUntilTruthy(
          async () => {
            return await sendTxEmail(payload as any);
          },
          { delay: 100, maxTry: 5 }
        );
      }

      return res.status(200).send({ sent: true });
    } catch (e) {
      log.debug("Error sending TOTP password:");
      log.error(e);

      return res.status(500).send({
        ERROR: true,
        MESSAGE: "INTERNAL SERVER ERROR: " + e,
      });
    }
  });

  r.post("/recover", validateSchema(recoverSchema), async (req, res) => {
    const { validateEmailToken, email, newClientAddress } = req.body;

    try {
      const userToUpdate: User | null = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (!userToUpdate) {
        log.info("Error: Could not find user with email: " + email);

        return res.status(401).send({
          ERROR: true,
          MESSAGE: "NOT FOUND: COULD NOT FIND USER WITH EMAIL: " + email,
        });
      }

      const { id } = userToUpdate;

      if (!(await validateTotp(validateEmailToken))) {
        log.info(
          ("Invalid validateEmailToken for token: " +
            userToUpdate.validateEmailToken) as string
        );

        return res.status(401).send({
          ERROR: true,
          MESSAGE: "INVALID TOKEN",
        });
      } else {
        await prisma.user.update({
          where: {
            id,
          },
          data: {
            validateEmailToken: null,
          },
        });
      }

      const { transactionId } = await replaceMultiSigOwner({
        id,
        newClientAddress,
        prisma,
      });

      if (!transactionId) {
        log.info("Error replacing multisig owner: " + email, {
          id,
          newClientAddress,
        });
        return res.status(500).send({
          ERROR: true,
          MESSAGE: "INTERNAL SERVER ERROR: COULD NOT REPLACE MULTISIG OWNER",
        });
      }

      return res.status(200).json({ user: userToUpdate, tx: transactionId });
    } catch (e) {
      log.debug("Error verifying TOTP or replacing multisig owner:");
      log.error(e);

      return res.status(500).send({
        ERROR: true,
        MESSAGE: "INTERNAL SERVER ERROR: " + e,
      });
    }
  });

  r.post("/update", validateSchema(updateSchema), async (req, res) => {
    if (!(req as any).user)
      return res
        .status(403)
        .send({ ERROR: true, MESSAGE: "NOT AUTHENTICATED" });

    const { userId, data } = req.body;

    if (!userId || !data) {
      return res.status(401).send({
        ERROR: true,
        MESSAGE: "BAD REQUEST: PARAMS DATA AND USER ID REQUIRED",
      });
    }

    try {
      const exists =
        (await prisma.user.findUnique({ where: { userId } })) || null;

      if (!exists) {
        return res.status(401).send({
          ERROR: true,
          MESSAGE:
            "INTERNAL SERVER ERROR: COULD NOT FIND USER WITH USER ID: " +
            userId,
        });
      }

      const user = await prisma.user.update({
        where: { id: exists.id },
        data: data,
      });

      if (user) return res.status(200).json({ user });

      return res.status(400).send({ updated: false });
    } catch (e) {
      log.debug("Error updating user:");
      log.error(e);

      return res.status(500).send({
        ERROR: true,
        MESSAGE: "INTERNAL SERVER ERROR: " + e,
      });
    }
  });

  r.post("/remove", validateSchema(removeAndFetchSchema), async (req, res) => {
    if (!(req as any).user)
      return res
        .status(403)
        .send({ ERROR: true, MESSAGE: "NOT AUTHENTICATED" });

    const { userId } = req.body;

    if (!userId) {
      return res.status(401).send({
        ERROR: true,
        MESSAGE: "BAD REQUEST: USER ID PARAM REQUIRED",
      });
    }

    try {
      const user =
        (await prisma.user.findUnique({ where: { userId } })) || null;

      if (!user) {
        return res.status(401).send({
          ERROR: true,
          MESSAGE:
            "INTERNAL SERVER ERROR: COULD NOT FIND USER WITH USER ID: " +
            userId,
        });
      }

      const resp = await prisma.user.delete({ where: { id: user.id } });

      if (!resp)
        return res.status(401).send({
          ERROR: true,
          MESSAGE:
            "INTERNAL SERVER ERROR: COULD NOT DELETE USER WITH USER ID: " +
            userId,
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
