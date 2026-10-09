import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate, requireRole } from '../../middleware/auth';
import { AppError } from '../../middleware/error';
import { CreateTableSchema, UpdateTableSchema, Role, SocketEvents } from '@/contracts';
import { tableRepository } from './repository';

export const tablesRouter = Router();

tablesRouter.use(authenticate);

// All authenticated users can list tables
tablesRouter.get('/', async (req, res, next) => {
  try {
    const tablesList = await tableRepository.findAll();
    res.json({ tables: tablesList });
  } catch (err) {
    next(err);
  }
});

// Admin only routes
tablesRouter.post('/', requireRole([Role.ADMIN]), validate(CreateTableSchema), async (req, res, next) => {
  try {
    const table = await tableRepository.create(req.body);
    req.app.get('io')?.emit(SocketEvents.TABLE_UPDATED, { table });
    res.json({ table });
  } catch (err) {
    next(err);
  }
});

tablesRouter.patch('/:id', requireRole([Role.ADMIN]), validate(UpdateTableSchema), async (req, res, next) => {
  try {
    const table = await tableRepository.update(req.params.id as string, req.body);
    if (!table) {
      throw new AppError('NOT_FOUND', 404, 'Table not found');
    }
    req.app.get('io')?.emit(SocketEvents.TABLE_UPDATED, { table });
    res.json({ table });
  } catch (err) {
    next(err);
  }
});

tablesRouter.delete('/:id', requireRole([Role.ADMIN]), async (req, res, next) => {
  try {
    await tableRepository.delete(req.params.id as string);
    req.app.get('io')?.emit(SocketEvents.TABLE_UPDATED, { deletedId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
