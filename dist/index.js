"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = void 0;
const main_controller_1 = require("./controllers/main.controller");
const server_1 = require("./server");
const client_1 = require(".prisma/client");
const config_1 = __importDefault(require("./config"));
const prisma = new client_1.PrismaClient();
const start = () => server_1.startServer({
    app: server_1.createServer({
        prisma,
    }, main_controller_1.main),
    port: config_1.default.PORT || 80,
}).catch((e) => console.log(e));
exports.start = start;
exports.start();
//# sourceMappingURL=index.js.map