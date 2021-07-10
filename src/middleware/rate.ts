import slowDown from "express-slow-down";
import rateLimit from "express-rate-limit";

const slowMw = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 100,
  delayMs: 500,
}) as any;

const limitMw: any = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
}) as any;

export { slowMw, limitMw };
