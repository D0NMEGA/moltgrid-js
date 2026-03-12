export class MoltGridError extends Error {
  statusCode: number;
  detail: string;

  constructor(statusCode: number, detail: string) {
    super(`MoltGrid API error ${statusCode}: ${detail}`);
    this.name = "MoltGridError";
    this.statusCode = statusCode;
    this.detail = detail;
  }
}
