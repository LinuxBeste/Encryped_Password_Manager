import { validate } from '../validate.middleware';
import { z, ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Creates mock request/response with body tracking
function mockReqRes(body: any = {}): {
  req: Request;
  res: Response & { _status: number; _body: any };
  next: NextFunction;
} {
  const req = { body, query: {}, params: {} } as unknown as Request;

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
    get _status() {
      return _status;
    },
    get _body() {
      return _body;
    },
  } as unknown as Response & { _status: number; _body: any };

  const next = jest.fn();
  return { req, res, next };
}

// Test schema with email, age, and name fields
const testSchema = z.object({
  email: z.string().email(),
  age: z.number().min(0).max(150),
  name: z.string().min(1).max(100),
});

describe('Validate Middleware', () => {
  it('passes valid body through', () => {
    const { req, res, next } = mockReqRes({ email: 'a@b.com', age: 25, name: 'John' });
    const middleware = validate(testSchema, 'body');
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ email: 'a@b.com', age: 25, name: 'John' });
  });

  it('strips unknown fields', () => {
    const { req, res, next } = mockReqRes({
      email: 'a@b.com',
      age: 30,
      name: 'Jane',
      extra: 'should be stripped',
    });
    const middleware = validate(testSchema, 'body');
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect((req.body as any).extra).toBeUndefined();
  });

  it('rejects missing required fields', () => {
    const { req, res, next } = mockReqRes({ email: 'a@b.com' });
    const middleware = validate(testSchema, 'body');
    middleware(req, res, next);
    expect(res._status).toBe(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects invalid email', () => {
    const { req, res, next } = mockReqRes({ email: 'not-an-email', age: 20, name: 'Test' });
    const middleware = validate(testSchema, 'body');
    middleware(req, res, next);
    expect(res._status).toBe(400);
  });

  it('rejects negative age', () => {
    const { req, res, next } = mockReqRes({ email: 'a@b.com', age: -1, name: 'Test' });
    const middleware = validate(testSchema, 'body');
    middleware(req, res, next);
    expect(res._status).toBe(400);
  });

  it('rejects age over max', () => {
    const { req, res, next } = mockReqRes({ email: 'a@b.com', age: 200, name: 'Test' });
    const middleware = validate(testSchema, 'body');
    middleware(req, res, next);
    expect(res._status).toBe(400);
  });

  it('rejects empty name', () => {
    const { req, res, next } = mockReqRes({ email: 'a@b.com', age: 20, name: '' });
    const middleware = validate(testSchema, 'body');
    middleware(req, res, next);
    expect(res._status).toBe(400);
  });

  it('rejects wrong type for age (string instead of number)', () => {
    const { req, res, next } = mockReqRes({ email: 'a@b.com', age: 'old', name: 'Test' });
    const middleware = validate(testSchema, 'body');
    middleware(req, res, next);
    expect(res._status).toBe(400);
  });

  it('rejects null body', () => {
    const { req, res, next } = mockReqRes(null);
    const middleware = validate(testSchema, 'body');
    middleware(req, res, next);
    expect(res._status).toBe(400);
  });

  it('coerces types when schema allows', () => {
    const coerceSchema = z.object({ count: z.coerce.number() });
    const { req, res, next } = mockReqRes({ count: '42' });
    const middleware = validate(coerceSchema, 'body');
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.body.count).toBe(42);
  });

  it('validates query params', () => {
    const querySchema = z.object({ page: z.coerce.number().positive() });
    const req = { body: {}, query: { page: '1' }, params: {} } as unknown as Request;
    let _status = 200;
    const res = {
      status: (code: number) => {
        _status = code;
        return res;
      },
      json: (d: any) => d,
      get _status() {
        return _status;
      },
    } as unknown as Response & { _status: number };
    const next = jest.fn();
    const middleware = validate(querySchema, 'query');
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('rejects invalid query params', () => {
    const querySchema = z.object({ page: z.coerce.number().positive() });
    const req = { body: {}, query: { page: '-1' }, params: {} } as unknown as Request;
    let _status = 200;
    const res = {
      status: (code: number) => {
        _status = code;
        return res;
      },
      json: (d: any) => d,
      get _status() {
        return _status;
      },
    } as unknown as Response & { _status: number };
    const next = jest.fn();
    const middleware = validate(querySchema, 'query');
    middleware(req, res, next);
    expect(res._status).toBe(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns descriptive error messages', () => {
    const { req, res, next } = mockReqRes({ email: 'bad', age: -5, name: '' });
    const middleware = validate(testSchema, 'body');
    middleware(req, res, next);
    expect(res._body.error).toContain('email');
    expect(res._body.error).toContain('age');
    expect(res._body.error).toContain('name');
  });
});
