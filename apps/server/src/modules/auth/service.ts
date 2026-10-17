import { userRepository } from './repository';
import { SignupInput, LoginInput, Role, User } from '@/contracts';
import { AppError } from '../../middleware/error';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { JwtPayload } from '../../middleware/auth';

export const authService = {
  async signup(input: SignupInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError('VALIDATION_ERROR', 400, 'Email already in use');
    }

    const passwordHash = await argon2.hash(input.password);
    
    // Always create as CUSTOMER (staff accounts are seeded)
    const user = await userRepository.create({
      ...input,
      passwordHash,
      role: Role.CUSTOMER
    });

    return this.generateToken(user);
  },

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new AppError('UNAUTHENTICATED', 401, 'Invalid email or password');
    }
    if (!user.isActive) {
      throw new AppError('FORBIDDEN', 403, 'This account has been deactivated');
    }

    const valid = await argon2.verify(user.passwordHash, input.password);
    if (!valid) {
      throw new AppError('UNAUTHENTICATED', 401, 'Invalid email or password');
    }

    return this.generateToken(user);
  },

  async getMe(userId: string): Promise<User> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('UNAUTHENTICATED', 401, 'User not found');
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      createdAt: user.createdAt.getTime()
    };
  },

  generateToken(user: { id: string; role: string }) {
    const payload: JwtPayload = { userId: user.id, role: user.role as Role };
    const token = jwt.sign(payload, config.JWT_SECRET, { expiresIn: '7d' });
    return token;
  }
};
