"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = exports.validate = void 0;
const otplib_1 = require("otplib");
const config_1 = __importDefault(require("../config"));
const options = otplib_1.totp.options;
otplib_1.totp.options = Object.assign(Object.assign({}, options), { step: 300 });
async function generate() {
    return await otplib_1.totp.generate(config_1.default.TOTP_SECRET);
}
exports.generate = generate;
async function validate(token) {
    return await otplib_1.totp.check(token, config_1.default.TOTP_SECRET);
}
exports.validate = validate;
//# sourceMappingURL=totp.js.map