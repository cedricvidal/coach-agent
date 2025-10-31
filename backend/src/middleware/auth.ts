import { Request, Response, NextFunction } from 'express';
import { auth } from 'express-oauth2-jwt-bearer';

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

export interface AuthRequest extends Request {
  auth?: {
    payload: {
      sub: string;
      [key: string]: any;
    };
  };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.auth?.payload?.sub) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};
