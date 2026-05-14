import { authenticate, AuthRequest } from '../auth.middleware';
import jwt from 'jsonwebtoken';
import { config } from '../../../utils/config';
import { Response, NextFunction } from 'express';

// Creates mock request with optional JWT token in cookie and header
function mockReqRes(token?: string): { req: AuthRequest; res: Response; next: NextFunction } {
  const req = {
    cookies: token ? { token } : {},
    headers: token ? { authorization: `Bearer ${token}` } : {},
  } as unknown as AuthRequest;

  let statusCode = 200;
  let body: any;

  const res = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (data: any) => {
      body = data;
      return res;
    },
    _getStatusCode: () => statusCode,
    _getBody: () => body,
  } as unknown as Response & { _getStatusCode: () => number; _getBody: () => any };

  const next = jest.fn();
  return { req, res, next };
}

describe('AuthMiddleware — authenticate', () => {
  it('passes with valid token from cookie', () => {
    const payload = { userId: 'test-user', email: 'test@test.com' };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '15m' });
    const { req, res, next } = mockReqRes(token);
    authenticate(req, res, next);
    expect(req.userId).toBe('test-user');
    expect(req.userEmail).toBe('test@test.com');
    expect(next).toHaveBeenCalled();
  });

  it('passes with valid token from Authorization header', () => {
    const payload = { userId: 'user2', email: 'user2@test.com' };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '15m' });
    const { req, res: _res, next } = mockReqRes();
    req.headers = { authorization: `Bearer ${token}` };
    authenticate(req, _res, next);
    expect(req.userId).toBe('user2');
    expect(next).toHaveBeenCalled();
  });

  it('rejects missing token', () => {
    const { req, res, next } = mockReqRes();
    authenticate(req, res, next);
    const body = (res as any)._getBody();
    expect((res as any)._getStatusCode()).toBe(401);
    expect(body.success).toBe(false);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects expired token', () => {
    const payload = { userId: 'x', email: 'x@x.com' };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '0s' });
    // Wait a tick for expiry
    const { req, res, next } = mockReqRes(token);
    authenticate(req, res, next);
    const body = (res as any)._getBody();
    expect((res as any)._getStatusCode()).toBe(401);
    expect(body.error).toContain('expired');
  });

  it('rejects malformed token', () => {
    const { req, res, next } = mockReqRes('not-a-valid-jwt');
    authenticate(req, res, next);
    const body = (res as any)._getBody();
    expect((res as any)._getStatusCode()).toBe(401);
    expect(body.error).toContain('Invalid');
  });

  it('rejects token signed with wrong secret', () => {
    const payload = { userId: 'x', email: 'x@x.com' };
    const token = jwt.sign(payload, 'wrong-secret', { expiresIn: '15m' });
    const { req, res, next } = mockReqRes(token);
    authenticate(req, res, next);
    expect((res as any)._getStatusCode()).toBe(401);
  });

  it('rejects empty token string', () => {
    const { req, res, next } = mockReqRes('');
    authenticate(req, res, next);
    expect((res as any)._getStatusCode()).toBe(401);
  });

  it('rejects token with missing userId', () => {
    const token = jwt.sign({ email: 'no-id@test.com' }, config.jwtSecret, { expiresIn: '15m' });
    const { req, res, next } = mockReqRes(token);
    authenticate(req, res, next);
    expect(req.userId).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('prefers cookie token over header', () => {
    const cookiePayload = { userId: 'cookie-user', email: 'cookie@test.com' };
    const headerPayload = { userId: 'header-user', email: 'header@test.com' };
    const cookieToken = jwt.sign(cookiePayload, config.jwtSecret, { expiresIn: '15m' });
    const headerToken = jwt.sign(headerPayload, config.jwtSecret, { expiresIn: '15m' });
    const { req, res, next } = mockReqRes(cookieToken);
    req.headers.authorization = `Bearer ${headerToken}`;
    authenticate(req, res, next);
    expect(req.userId).toBe('cookie-user');
    expect(next).toHaveBeenCalled();
  });
});
