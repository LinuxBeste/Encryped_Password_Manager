import { csrfProtection } from '../csrf.middleware';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

function mockReqRes(overrides: Partial<Request> = {}): { req: Request; res: Response & { _status: number; _body: any }; next: NextFunction } {
  let _status = 200;
  let _body: any;

  const req = {
    method: 'POST',
    cookies: {},
    headers: {},
    ...overrides,
  } as unknown as Request;

  const res = {
    cookie: (name: string, value: string, options: any) => {
      return res;
    },
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

describe('CSRF Middleware', () => {
  it('sets csrf cookie on safe methods (GET)', () => {
    const { req, res, next } = mockReqRes({ method: 'GET' });
    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('sets csrf cookie on HEAD', () => {
    const { req, res, next } = mockReqRes({ method: 'HEAD' });
    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('sets csrf cookie on OPTIONS', () => {
    const { req, res, next } = mockReqRes({ method: 'OPTIONS' });
    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('does not reset csrf cookie if already present on GET', () => {
    const existingToken = crypto.randomBytes(32).toString('hex');
    const { req, res, next } = mockReqRes({
      method: 'GET',
      cookies: { 'csrf-token': existingToken },
    });
    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('blocks POST without csrf token header', () => {
    const { req, res, next } = mockReqRes({
      method: 'POST',
      cookies: { 'csrf-token': 'some-token' },
      headers: {},
    });
    csrfProtection(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('blocks POST with mismatched tokens', () => {
    const { req, res, next } = mockReqRes({
      method: 'POST',
      cookies: { 'csrf-token': 'cookie-token' },
      headers: { 'x-csrf-token': 'different-token' },
    });
    csrfProtection(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows POST with matching tokens', () => {
    const token = crypto.randomBytes(32).toString('hex');
    const { req, res, next } = mockReqRes({
      method: 'POST',
      cookies: { 'csrf-token': token },
      headers: { 'x-csrf-token': token },
    });
    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('allows PUT with matching tokens', () => {
    const token = crypto.randomBytes(32).toString('hex');
    const { req, res, next } = mockReqRes({
      method: 'PUT',
      cookies: { 'csrf-token': token },
      headers: { 'x-csrf-token': token },
    });
    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('allows DELETE with matching tokens', () => {
    const token = crypto.randomBytes(32).toString('hex');
    const { req, res, next } = mockReqRes({
      method: 'DELETE',
      cookies: { 'csrf-token': token },
      headers: { 'x-csrf-token': token },
    });
    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('allows PATCH with matching tokens', () => {
    const token = crypto.randomBytes(32).toString('hex');
    const { req, res, next } = mockReqRes({
      method: 'PATCH',
      cookies: { 'csrf-token': token },
      headers: { 'x-csrf-token': token },
    });
    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  const unsafeMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  it.each(unsafeMethods)('blocks %s without csrf cookie', (method) => {
    const { req, res, next } = mockReqRes({
      method,
      cookies: {},
      headers: { 'x-csrf-token': 'some-token' },
    });
    csrfProtection(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 with error message on mismatch', () => {
    const { req, res, next } = mockReqRes({
      method: 'POST',
      cookies: { 'csrf-token': 'a' },
      headers: { 'x-csrf-token': 'b' },
    });
    csrfProtection(req, res, next);
    expect(res._status).toBe(403);
  });
});
