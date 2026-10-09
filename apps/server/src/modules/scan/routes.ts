import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { AppError } from '../../middleware/error';
import { Role, TableStatus, SocketEvents } from '@/contracts';
import { sessionRepository } from '../sessions/repository';
import { tableRepository } from '../tables/repository';

export const scanRouter = Router();

scanRouter.use(authenticate);

// GET /t/:qrToken
scanRouter.get('/:qrToken', async (req, res, next) => {
  try {
    const { qrToken } = req.params;
    const table = await sessionRepository.findTableByQrToken(qrToken);
    
    if (!table) {
      throw new AppError('NOT_FOUND', 404, 'Table not found');
    }

    let relation = 'blocked';
    
    // Determine relationship
    if (req.user?.role === Role.CUSTOMER) {
      const activeSession = await sessionRepository.findActiveByCustomerId(req.user.userId);
      if (activeSession) {
        if (activeSession.tableId === table.id) {
          relation = 'seated_here';
        } else {
          relation = 'blocked'; // Already seated elsewhere
        }
      } else {
        // No active session, check table status
        if (table.status === TableStatus.AVAILABLE) {
          relation = 'can_seat';
        } else if (table.status === TableStatus.OCCUPIED) {
          relation = 'occupied';
        }
      }
    } else {
      relation = 'staff';
    }

    res.json({ table, relation });
  } catch (err) {
    next(err);
  }
});

// POST /t/:qrToken/seat
scanRouter.post('/:qrToken/seat', async (req, res, next) => {
  try {
    if (req.user?.role !== Role.CUSTOMER) {
      throw new AppError('FORBIDDEN', 403, 'Only customers can take a table');
    }

    const table = await sessionRepository.findTableByQrToken(req.params.qrToken);
    if (!table) {
      throw new AppError('NOT_FOUND', 404, 'Table not found');
    }

    const activeSession = await sessionRepository.findActiveByCustomerId(req.user.userId);
    if (activeSession) {
      throw new AppError('CONFLICT', 409, 'ALREADY_HAS_SESSION');
    }

    if (table.status !== TableStatus.AVAILABLE) {
       throw new AppError('CONFLICT', 409, 'TABLE_NOT_FREE');
    }

    const session = await sessionRepository.createSessionTransaction(table.id, req.user.userId);
    
    // Broadcast table update
    const updatedTable = await tableRepository.findById(table.id);
    req.app.get('io')?.emit(SocketEvents.TABLE_UPDATED, { table: updatedTable });
    
    res.json({ session, table: updatedTable });
  } catch (err) {
    next(err);
  }
});
