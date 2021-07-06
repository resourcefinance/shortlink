"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.createToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../../config"));
if (!config_1.default.JWT_SECRET) {
    console.error("NO TOKEN SECRET FOUND");
    process.exit(1);
}
const createToken = ({ id, email }) => {
    const token = jsonwebtoken_1.default.sign({
        id,
        email,
    }, config_1.default.JWT_SECRET);
    return token;
};
exports.createToken = createToken;
const verifyToken = (token) => {
    const { id, email } = jsonwebtoken_1.default.verify(token, config_1.default.JWT_SECRET);
    return { id, email };
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=auth.utils.js.map