"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoltGridError = void 0;
class MoltGridError extends Error {
    statusCode;
    detail;
    constructor(statusCode, detail) {
        super(`MoltGrid API error ${statusCode}: ${detail}`);
        this.name = "MoltGridError";
        this.statusCode = statusCode;
        this.detail = detail;
    }
}
exports.MoltGridError = MoltGridError;
