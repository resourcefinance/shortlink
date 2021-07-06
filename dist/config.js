"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchConfig = exports.isProd = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function isProd() {
    return process.env.NODE_ENV === "production";
}
exports.isProd = isProd;
function fetchConfig() {
    return {
        NODE_ENV: process.env.NODE_ENV,
        PORT: parseInt(process.env.PORT) || 4000,
        POSTGRES: process.env.POSTGRES,
        JWT_SECRET: process.env.JWT_SECRET,
        TOTP_SECRET: process.env.TOTP_SECRET,
        GUARDIAN_WALLET_PK: process.env.GUARDIAN_PK,
        BLOCKCHAIN_NETWORK: process.env.BLOCKCHAIN_NETWORK,
        CUSTOMERIO_SITE_ID: "",
        CUSTOMERIO_API_KEY: "",
        CUSTOMERIO_APP_API_KEY: "",
    };
}
exports.fetchConfig = fetchConfig;
exports.default = fetchConfig();
//# sourceMappingURL=config.js.map