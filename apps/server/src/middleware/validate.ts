import { Request, Response, NextFunction } from 'express';
import { AppError } from './error';

export const validate = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues?.[0]?.message || 'Validation error';
      next(new AppError('VALIDATION_ERROR', 400, message));
    } else {
      req.body = result.data;
      next();
    }
  };
};
