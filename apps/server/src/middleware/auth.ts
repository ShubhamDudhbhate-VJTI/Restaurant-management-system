import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from './error';
import { Role } from '@/contracts';

export interface JwtPayload {
  userId: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token;
  
  if (!token) {
    return next(new AppError('UNAUTHENTICATED', 401, 'Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    return next(new AppError('UNAUTHENTICATED', 401, 'Invalid or expired token'));
  }
};

export const requireRole = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('UNAUTHENTICATED', 401, 'Authentication required'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new AppError('FORBIDDEN', 403, 'Insufficient permissions'));
    }
    
    next();
  };
};
