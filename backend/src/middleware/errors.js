import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(status, code, message, { retryable = false, details } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.retryable = retryable;
    this.details = details;
  }
}

export function notFound(req, res, next) {
  next(new AppError(404, 'NOT_FOUND', `No route for ${req.method} ${req.path}`));
}

// Every error leaves the API in the same shape: { error: { code, message, retryable, details? } }
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    err = new AppError(400, 'VALIDATION_ERROR', 'Some trip details need fixing.', {
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  } else if (err.type === 'entity.parse.failed') {
    err = new AppError(400, 'VALIDATION_ERROR', 'Request body is not valid JSON.');
  } else if (!(err instanceof AppError)) {
    console.error(err);
    err = new AppError(500, 'INTERNAL', 'Something went wrong on our side.', { retryable: true });
  }

  res.status(err.status).json({
    error: {
      code: err.code,
      message: err.message,
      retryable: err.retryable,
      ...(err.details && { details: err.details }),
    },
  });
}
