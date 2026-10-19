import type { Response } from 'express';

export function setAuthCookie(res: Response, token: string) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: true, // Required for sameSite: 'none'
    sameSite: 'none', // Allows cross-site cookies
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}
