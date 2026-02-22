export class OctivasError extends Error {
  readonly statusCode?: number;
  readonly body?: Record<string, unknown>;

  constructor(
    message: string,
    options?: { statusCode?: number; body?: Record<string, unknown> },
  ) {
    super(message);
    this.name = "OctivasError";
    this.statusCode = options?.statusCode;
    this.body = options?.body;
  }
}

export class AuthenticationError extends OctivasError {
  constructor(
    message: string,
    options?: { body?: Record<string, unknown> },
  ) {
    super(message, { statusCode: 401, ...options });
    this.name = "AuthenticationError";
  }
}

export class BadRequestError extends OctivasError {
  constructor(
    message: string,
    options?: { statusCode?: number; body?: Record<string, unknown> },
  ) {
    super(message, { statusCode: options?.statusCode ?? 400, ...options });
    this.name = "BadRequestError";
  }
}

export class NotFoundError extends OctivasError {
  constructor(
    message: string,
    options?: { body?: Record<string, unknown> },
  ) {
    super(message, { statusCode: 404, ...options });
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends OctivasError {
  constructor(
    message: string,
    options?: { body?: Record<string, unknown> },
  ) {
    super(message, { statusCode: 429, ...options });
    this.name = "RateLimitError";
  }
}

export class ServerError extends OctivasError {
  constructor(
    message: string,
    options?: { statusCode?: number; body?: Record<string, unknown> },
  ) {
    super(message, { statusCode: options?.statusCode ?? 500, ...options });
    this.name = "ServerError";
  }
}
