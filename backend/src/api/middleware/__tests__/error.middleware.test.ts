import { errorHandler, createError, AppError } from '../error.middleware';
import { Request, Response, NextFunction } from 'express';

// Creates mock request/response for testing error handler
function mockReqRes(): { req: Request; res: Response & { _status: number; _body: any }; next: NextFunction } {
  const req = {} as Request;
  let _status = 200;
  let _body: any;

  const res = {
    status: (code: number) => {
      _status = code;
      return res;
    },
    json: (data: any) => {
      _body = data;
      return res;
    },
    get _status() { return _status; },
    get _body() { return _body; },
  } as unknown as Response & { _status: number; _body: any };

  const next = jest.fn();
  return { req, res, next };
}

describe('ErrorHandler Middleware', () => {
  it('handles operational errors with correct status code', () => {
    const { req, res, next } = mockReqRes();
    const err = createError(400, 'Bad request');
    errorHandler(err, req, res, next);
    expect(res._status).toBe(400);
    expect(res._body).toEqual({ success: false, error: 'Bad request' });
  });

  it('handles 404 errors', () => {
    const { req, res, next } = mockReqRes();
    const err = createError(404, 'Not found');
    errorHandler(err, req, res, next);
    expect(res._status).toBe(404);
    expect(res._body.error).toContain('Not found');
  });

  it('handles 429 rate limit errors', () => {
    const { req, res, next } = mockReqRes();
    const err = createError(429, 'Too many requests');
    errorHandler(err, req, res, next);
    expect(res._status).toBe(429);
  });

  it('handles 500 for non-operational errors safely', () => {
    const { req, res, next } = mockReqRes();
    const err = new Error('Something crashed') as AppError;
    err.isOperational = false;
    errorHandler(err, req, res, next);
    expect(res._status).toBe(500);
    expect(res._body.error).toBe('Internal server error');
  });

  it('defaults to 500 for errors without statusCode', () => {
    const { req, res, next } = mockReqRes();
    const err = new Error('Generic error') as AppError;
    err.isOperational = true;
    errorHandler(err, req, res, next);
    expect(res._status).toBe(500);
  });

  it('handles 401 unauthorized errors', () => {
    const { req, res, next } = mockReqRes();
    const err = createError(401, 'Unauthorized');
    errorHandler(err, req, res, next);
    expect(res._status).toBe(401);
    expect(res._body.error).toBe('Unauthorized');
  });

  it('handles 403 forbidden errors', () => {
    const { req, res, next } = mockReqRes();
    const err = createError(403, 'Forbidden');
    errorHandler(err, req, res, next);
    expect(res._status).toBe(403);
  });

  it('handles 409 conflict errors', () => {
    const { req, res, next } = mockReqRes();
    const err = createError(409, 'Conflict');
    errorHandler(err, req, res, next);
    expect(res._status).toBe(409);
  });
});

describe('createError helper', () => {
  it('creates error with correct status code', () => {
    const err = createError(400, 'test');
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('test');
    expect(err.isOperational).toBe(true);
  });

  it('creates error with 500', () => {
    const err = createError(500, 'server error');
    expect(err.statusCode).toBe(500);
  });

  it('creates error with custom message', () => {
    const err = createError(418, "I'm a teapot");
    expect(err.message).toBe("I'm a teapot");
  });

  it('creates instances of Error', () => {
    const err = createError(400, 'x');
    expect(err instanceof Error).toBe(true);
    expect(err instanceof Error).toBe(true);
  });
});
