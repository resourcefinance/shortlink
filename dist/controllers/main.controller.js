"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const express_1 = require("express");
const yup = __importStar(require("yup"));
const middleware_1 = require("../middleware");
const services_1 = require("../services");
const auth_utils_1 = require("./utils/auth.utils");
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
const main = ({ prisma }) => {
    const router = express_1.Router();
    router.get("/token", async (req, res, next) => {
        const { email } = req.body;
        const user = await prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (!user) {
            next();
            return res.status(500).send("User not found");
        }
        const token = auth_utils_1.createToken({ id: user.userId, email: user.email });
        res.status(200).json({
            token,
        });
        next();
    });
    router.get("/", (_, res, next) => {
        res.status(200).send("ok");
        next();
    });
    router.post("/register", middleware_1.validate(registerSchema), async (req, res, next) => {
        const { userId, email, multiSigAddress, clientAddress } = req.body;
        try {
            const exists = (await prisma.user.count({ where: { userId } })) ||
                (await prisma.user.count({ where: { email } }));
            if (exists) {
                next();
                return res
                    .status(400)
                    .send({ ERROR: true, MESSAGE: "USER WITH EMAIL OR USERID EXISTS" });
            }
            const validateEmailToken = await services_1.generate();
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
            return res.status(200).json({
                user,
            });
            next();
        }
        catch (e) {
            services_1.log.error(e);
            return res.status(500).send({
                ERROR: true,
                MESSAGE: "INTERNAL SERVER ERROR: " + e,
            });
        }
    });
    router.post("/recover", middleware_1.validate(recoverSchema), async (req, res, next) => {
        const { validateEmailToken, email, newClientAddress } = req.body;
        try {
            const user = await prisma.user.findUnique({
                where: {
                    email,
                },
            });
            if (!user) {
                services_1.log.info("Error creating user with email: " + email);
                res.status(401).send({
                    ERROR: true,
                    MESSAGE: "INTERNAL SERVER ERROR: COULD NOT FIND USER WITH EMAIL: " + email,
                });
                next();
                return;
            }
            if (validateEmailToken !== user.validateEmailToken) {
                services_1.log.info(("Invalid validateEmailToken for token: " +
                    user.validateEmailToken));
                next();
                return res.status(401).send({
                    ERROR: true,
                    MESSAGE: "INTERNAL SERVER ERROR: INVALID TOKEN",
                });
            }
            const { id } = user;
            const txId = await services_1.replaceMultiSigOwner({
                id,
                newClientAddress,
                prisma,
            });
            next();
            return res.status(200).json({ user, tx: txId });
        }
        catch (e) {
            services_1.log.error(e);
            return res.status(500).send({
                ERROR: true,
                MESSAGE: "INTERNAL SERVER ERROR: " + e,
            });
        }
    });
    return {
        path: "/api",
        router,
    };
};
exports.main = main;
//# sourceMappingURL=main.controller.js.map