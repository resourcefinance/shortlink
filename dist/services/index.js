"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = exports.replaceMultiSigOwner = exports.validate = exports.generate = void 0;
var totp_1 = require("./totp");
Object.defineProperty(exports, "generate", { enumerable: true, get: function () { return totp_1.generate; } });
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return totp_1.validate; } });
var wallet_1 = require("./wallet");
Object.defineProperty(exports, "replaceMultiSigOwner", { enumerable: true, get: function () { return wallet_1.replaceMultiSigOwner; } });
var logger_1 = require("./logger");
Object.defineProperty(exports, "log", { enumerable: true, get: function () { return logger_1.log; } });
//# sourceMappingURL=index.js.map