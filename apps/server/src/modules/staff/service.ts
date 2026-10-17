import argon2 from 'argon2';
import { Role } from '@/contracts';
import { staffRepository } from './repository';
import { AppError } from '../../middleware/error';
import { recordAudit } from '../audit/service';

export class StaffService {
  async getAllStaff() {
    return staffRepository.getAllStaff();
  }

  async createStaff(adminUserId: string, data: { name: string; email: string; password?: string; role: Role }) {
    const existing = await staffRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError('CONFLICT', 409, 'Email already in use');
    }

    const passwordHash = await argon2.hash(data.password || 'password123');
    const user = await staffRepository.createStaff({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role
    });

    await recordAudit({
      actorUserId: adminUserId,
      action: 'STAFF_CREATED',
      entityType: 'USER',
      entityId: user.id,
      metadata: { role: user.role }
    });

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async updateStaffRole(adminUserId: string, staffId: string, role: Role) {
    if (role === Role.CUSTOMER) {
      throw new AppError('VALIDATION_ERROR', 400, 'Staff role required');
    }

    const user = await staffRepository.updateStaffRole(staffId, role);
    if (!user) {
      throw new AppError('NOT_FOUND', 404, 'Staff member not found');
    }

    await recordAudit({
      actorUserId: adminUserId,
      action: 'STAFF_ROLE_CHANGED',
      entityType: 'USER',
      entityId: user.id,
      metadata: { role }
    });

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async updateStaffStatus(adminUserId: string, staffId: string, isActive: boolean) {
    if (staffId === adminUserId && !isActive) {
      throw new AppError('VALIDATION_ERROR', 400, 'You cannot deactivate your own account');
    }

    const user = await staffRepository.updateStaffStatus(staffId, isActive);
    if (!user) {
      throw new AppError('NOT_FOUND', 404, 'Staff member not found');
    }

    await recordAudit({
      actorUserId: adminUserId,
      action: isActive ? 'STAFF_ACTIVATED' : 'STAFF_DEACTIVATED',
      entityType: 'USER',
      entityId: user.id
    });

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}

export const staffService = new StaffService();
