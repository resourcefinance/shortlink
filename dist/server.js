"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = exports.createServer = void 0;
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const body_parser_1 = __importDefault(require("body-parser"));
const config_1 = require("./config");
const middleware_1 = require("./middleware");
const createServer = (dependencies, ...controllers) => {
    const app = express_1.default();
    app.use(express_1.default.json());
    app.use((req, res, next) => {
        res.append("Access-Control-Allow-Origin", ["*"]);
        res.append("Access-Control-Allow-Methods", "POST");
        res.append("Access-Control-Allow-Headers", "Content-Type");
        next();
    });
    if (!config_1.isProd()) {
        app.use(body_parser_1.default.json());
        app.use(body_parser_1.default.urlencoded({ extended: false }));
    }
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