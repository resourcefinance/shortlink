"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.unless = exports.authenticate = void 0;
const auth_utils_1 = require("../controllers/utils/auth.utils");
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const user = auth_utils_1.verifyToken(token);
        req.user = user;
        next();
    }
    else {
        res.status(401).send({ ERROR: true, MESSAGE: "NOT AUTHENTICATED" });
    }
}
exports.authenticate = authenticate;
function unless(middleware, ...paths) {
    return function (req, res, next) {
        const pathCheck = paths.some((path) => path === req.path);
        pathCheck ? next() : middleware(req, res, next);
    };
}
exports.unless = unless;
exports.auth = unless(authenticate, "/api/", "/api/token", "/api/register");
//# sourceMappingURL=auth.middleware.js.map