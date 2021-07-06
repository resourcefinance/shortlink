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
exports.sendTxEmail = void 0;
const api_1 = require("customerio-node/api");
const Sentry = __importStar(require("sentry"));
const logger_1 = require("./logger");
const config_1 = __importStar(require("../config"));
async function sendTxEmail(payload) {
    try {
        const client = new api_1.APIClient(config_1.default.CUSTOMERIO_APP_API_KEY);
        const request = new api_1.SendEmailRequest({
            to: payload.to,
            transactional_message_id: config_1.isProd() ? "11" : "13",
            message_data: payload.data,
            identifiers: {
                id: payload.userId,
            },
        });
        await client.sendEmail(request);
    }
    catch (e) {
        Sentry.captureException(e);
        logger_1.log.error("Error sending CIO transactional email: ", e);
    }
}
exports.sendTxEmail = sendTxEmail;
//# sourceMappingURL=customerio.js.map