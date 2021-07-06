"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = exports.createServer = void 0;
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const middleware_1 = require("./middleware");
const createServer = (dependencies, ...controllers) => {
    const app = express_1.default();
    app.use(express_1.default.json());
    app.use(morgan_1.default("dev"));
    app.use(middleware_1.auth);
    for (const setupController of controllers) {
        const controller = setupController(dependencies);
        app.use(controller.path, controller.router);
    }
    return app;
};
exports.createServer = createServer;
const startServer = async ({ app, port, }) => {
    return app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
};
exports.startServer = startServer;
//# sourceMappingURL=server.js.map