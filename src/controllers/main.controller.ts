import { User } from "@prisma/client";
import { Router } from "express";
import * as yup from "yup";
import config from "../config";

import { validate as validateSchema } from "../middleware";
import {
  generate,
  validate as validateTotp,
  log,
  replaceMultiSigOwner,
  guardianAddr,
} from "../services";
import { sendTxEmail } from "../services/customerio";
import {} from "../services/wallet";
import { Controller } from "./types";

const registerSchema = yup
  .object()
  .shape({
    email: yup.string().required().email(),
    multiSigAddress: yup.string().required(),
    clientAddress: yup.string().required(),
    userId: yup.string().required(),
  })
  .required();

const recoverSchema = yup
  .object()
  .shape({
    validateEmailToken: yup.string().required(),
    email: yup.string().required().email(),
    newClientAddress: yup.string().required(),
  })
  .required();

const resetSchema = yup
  .object()
  .shape({
    email: yup.string().required().email(),
  })
  .required();

export const main: Controller = ({ prisma }) => {
  const router = Router();

  router.get("/", (_, res, next) => {
    res.status(200).send("OK");
    next();
  });

  router.post(
    "/register",
    validateSchema(registerSchema),
    async (req, res, next) => {
      if (!(req as any).user)
        res.status(401).send({ ERROR: true, MESSAGE: "NOT AUTHENTICATED" });

      const { userId, email, multiSigAddress, clientAddress } = req.body;

      try {
        const exists =
          (await prisma.user.count({ where: { userId } })) ||
          (await prisma.user.count({ where: { email } }));

        if (exists) {
          next();
          return res
            .status(400)
            .send({ ERROR: true, MESSAGE: "USER WITH EMAIL OR USERID EXISTS" });
        }

        const validateEmailToken = await generate();

        const user = await prisma.user.create({
          data: {
            userId,
            email,
            multiSigAddress,
            validateEmailToken,
            clientAddress,
          },
        });

        if (!user) {
          res.status(500).send({
            ERROR: true,
            MESSAGE: "INTERNAL SERVER ERROR: COULD NOT CREATE USER",
          });
          next();
          return;
        }

        const guardian = await guardianAddr();

        next();

        return res.status(200).json({
          user,
          guardian,
        });
      } catch (e) {
        log.error(e);
        return res.status(500).send({
          ERROR: true,
          MESSAGE: "INTERNAL SERVER ERROR: " + e,
        });
      }
    }
  );

  router.post("/reset", validateSchema(resetSchema), async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
      return res.status(401).send({
        ERROR: true,
        MESSAGE: "INTERNAL SERVER ERROR: EMAIL PARAM REQUIRED",
      });
      next();
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        next();
        return res.status(401).send({
          ERROR: true,
          MESSAGE:
            "INTERNAL SERVER ERROR: COULD NOT FIND USER WITH EMAIL: " + email,
        });
      }

      const payload = {
        otp: user.validateEmailToken,
        to: user.email,
        id: user.userId,
      };

      const resp = await sendTxEmail(payload as any);
      if (resp) return res.status(200).send({ sent: true });

      return res.status(200).send({ sent: false });
    } catch (e) {
      log.error(e);
      next();
      return res.status(500).send({
        ERROR: true,
        MESSAGE: "INTERNAL SERVER ERROR: " + e,
      });
    }
  });

  router.post(
    "/recover",
    validateSchema(recoverSchema),
    async (req, res, next) => {
      const { validateEmailToken, email, newClientAddress } = req.body;

      try {
        const userToUpdate: User | null = await prisma.user.findUnique({
          where: {
            email,
          },
        });

        if (!userToUpdate) {
          log.info("Error: Could not find user with email: " + email);
          res.status(401).send({
            ERROR: true,
            MESSAGE:
              "INTERNAL SERVER ERROR: COULD NOT FIND USER WITH EMAIL: " + email,
          });
          next();
          return;
        }

        if (!(await validateTotp(validateEmailToken))) {
          log.info(
            ("Invalid validateEmailToken for token: " +
              userToUpdate.validateEmailToken) as string
          );
          next();
          return res.status(401).send({
            ERROR: true,
            MESSAGE: "INTERNAL SERVER ERROR: INVALID TOKEN",
          });
        }

        const { id } = userToUpdate;

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
          res.status(500).send({
            ERROR: true,
            MESSAGE: "INTERNAL SERVER ERROR: COULD NOT REPLACE MULTISIG OWNER",
          });
          next();
          return;
        }

        next();

        return res
          .status(200)
          .json({ user: userToUpdate, tx: "transactionId" });
      } catch (e) {
        log.error(e);
        return res.status(500).send({
          ERROR: true,
          MESSAGE: "INTERNAL SERVER ERROR: " + e,
        });
      }
    }
  );

  return {
    path: "/api",
    router,
  };
};
