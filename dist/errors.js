export class MoltGridError extends Error {
    statusCode;
    detail;
    constructor(statusCode, detail) {
        super(`MoltGrid API error ${statusCode}: ${detail}`);
        this.name = "MoltGridError";
        this.statusCode = statusCode;
        this.detail = detail;
    }
}
//# sourceMappingURL=errors.js.map