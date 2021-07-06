"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.auth = exports.unless = exports.authenticate = void 0;
const auth_utils_1 = require("../controllers/utils/auth.utils");
const services_1 = require("../services");
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
const validate = (schema) => async (req, res, next) => {
    const body = req.body;
    try {
        await schema.validate(body);
        next();
    }
    catch (e) {
        services_1.log.error(e.message);
        res
            .status(400)
            .json({ ERROR: true, MESSAGE: "SCHEMA VALIDATION ERROR: " + e.message });
    }
};
exports.validate = validate;
//# sourceMappingURL=index.js.map