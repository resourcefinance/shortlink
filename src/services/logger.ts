import { createLogger, format, transports, addColors } from "winston";
import safeJsonStringify from "safe-json-stringify";

const { Console, File } = transports;
const { combine, timestamp, colorize, printf, metadata } = format;

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

addColors(colors);

const plugins = [
  new Console({
    format: format.printf((info: any) => {
      if (!info.metadata) {
        return `${info.timestamp}: ${info.message}`;
      }

      return `${info.timestamp}: ${info.message}\n${safeJsonStringify(
        info.metadata,
        null,
        2
      )}\n`;
    }),
  }),
  new File({
    filename: "logs/error.log",
    level: "error",
  }),
  new transports.File({ filename: "logs/all.log" }),
];

const formatting = combine(
  timestamp(),
  colorize({ all: true }),
  printf((info: any) => {
    return `${info.timestamp} ${info.level}: ${info.message}`;
  })
);

const logger = createLogger({
  format: formatting,
  transports: plugins,
  level: level(),
  levels: modes,
});

export const log = {
  error: (message: string, meta?: unknown) => {
    logger.log({ level: "error", message, metadata: meta });
  },
  warn: (message: string, meta?: unknown) => {
    logger.log({ level: "warn", message, metadata: meta });
  },
  info: (message: string, meta?: unknown) => {
    logger.log({ level: "info", message, metadata: meta });
  },
  http: (message: string, meta?: unknown) => {
    logger.log({ level: "http", message, metadata: meta });
  },
  debug: (message: string, meta?: unknown) => {
    logger.log({ level: "error", message, metadata: meta });
  },
};
