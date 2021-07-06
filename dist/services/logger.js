"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
const winston_1 = require("winston");
const safe_json_stringify_1 = __importDefault(require("safe-json-stringify"));
const { Console, File } = winston_1.transports;
const { combine, timestamp, colorize, printf, metadata } = winston_1.format;
const modes = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
const level = () => {
    const env = process.env.NODE_ENV || "development";
    const isDevelopment = env === "development";
    return isDevelopment ? "debug" : "warn";
};
const colors = {
    error: "red",
    warn: "yellow",
    info: "blue",
    http: "green",
    debug: "white",
};
winston_1.addColors(colors);
const plugins = [
    new Console({
        format: winston_1.format.printf((info) => {
            if (!info.metadata) {
                return `${info.timestamp}: ${info.message}`;
            }
            return `${info.timestamp}: ${info.message}\n${safe_json_stringify_1.default(info.metadata, null, 2)}\n`;
        }),
    }),
    new File({
        filename: "logs/error.log",
        level: "error",
    }),
    new winston_1.transports.File({ filename: "logs/all.log" }),
];
const formatting = combine(timestamp(), colorize({ all: true }), printf((info) => {
    return `${info.timestamp} ${info.level}: ${info.message}`;
}));
const logger = winston_1.createLogger({
    format: formatting,
    transports: plugins,
    level: level(),
    levels: modes,
});
exports.log = {
    error: (message, meta) => {
        logger.log({ level: "error", message, metadata: meta });
    },
    warn: (message, meta) => {
        logger.log({ level: "warn", message, metadata: meta });
    },
    info: (message, meta) => {
        logger.log({ level: "info", message, metadata: meta });
    },
    http: (message, meta) => {
        logger.log({ level: "http", message, metadata: meta });
    },
    debug: (message, meta) => {
        logger.log({ level: "error", message, metadata: meta });
    },
};
//# sourceMappingURL=logger.js.map