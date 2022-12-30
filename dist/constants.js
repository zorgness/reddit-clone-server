"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.__secret__ = exports.__prod__ = void 0;
exports.__prod__ = process.env.NODE_ENV === "production";
exports.__secret__ = process.env.REACT_APP_SECRET_SESSION;
//# sourceMappingURL=constants.js.map