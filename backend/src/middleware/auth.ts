import { Request, Response, NextFunction } from 'express';
import { auth, AuthResult } from 'express-oauth2-jwt-bearer';

// Lazy initialization of Auth0 JWT middleware
// This ensures environment variables are loaded before creating the auth instance
let jwtMiddleware: ReturnType<typeof auth> | null = null;

const getJwtMiddleware = () => {
  if (!jwtMiddleware) {
    jwtMiddleware = auth({
      audience: process.env.AUTH0_AUDIENCE,
      issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    });
  }
  return jwtMiddleware;
};

export const checkJwt = (req: Request, res: Response, next: NextFunction) => {
  const middleware = getJwtMiddleware();
  return middleware(req, res, next);
};

// Extend Request to include auth property with AuthResult
export interface AuthRequest extends Request {
  auth?: AuthResult;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.auth?.payload?.sub) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Middleware to check for specific permissions
export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const payload = req.auth?.payload;
    const permissions: string[] = Array.isArray(payload?.permissions)
      ? payload.permissions
      : typeof payload?.scope === 'string'
      ? payload.scope.split(' ')
      : [];

    if (!permissions.includes(permission)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to access this resource. Please contact the administrator for approval.'
      });
    }

    next();
  };
};
