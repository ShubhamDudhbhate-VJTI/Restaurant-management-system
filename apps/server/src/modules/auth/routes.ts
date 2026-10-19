import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { SignupSchema, LoginSchema } from '@/contracts';
import { authService } from './service';
import { setAuthCookie } from '../../utils/cookies';

export const authRouter = Router();

authRouter.post('/signup', validate(SignupSchema), async (req, res, next) => {
  try {
    const token = await authService.signup(req.body);
    setAuthCookie(res, token);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', validate(LoginSchema), async (req, res, next) => {
  try {
    const token = await authService.login(req.body);
    setAuthCookie(res, token);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });
  res.json({ success: true });
});

authRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user!.userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});
