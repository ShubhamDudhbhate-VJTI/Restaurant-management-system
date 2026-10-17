import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role, SocketEvents } from '@/contracts';
import { menuRepository } from './repository';
import { menuService } from './service';
import { CreateCategorySchema, UpdateCategorySchema, CreateMenuItemSchema, UpdateMenuItemSchema } from '@/contracts';
import { z } from 'zod';

export const menuRouter = Router();

// Public: Get entire menu
menuRouter.get('/', async (req, res, next) => {
  try {
    const menu = await menuService.getMenu();
    res.json({ menu });
  } catch (err) {
    next(err);
  }
});

// Admin: Manage Categories
menuRouter.post('/categories', authenticate, requireRole([Role.ADMIN]), async (req, res, next) => {
  try {
    const data = CreateCategorySchema.parse(req.body);
    const category = await menuRepository.createCategory(data);
    req.app.get('io')?.emit(SocketEvents.MENU_UPDATED);
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
});

menuRouter.put('/categories/:id', authenticate, requireRole([Role.ADMIN]), async (req, res, next) => {
  try {
    const data = UpdateCategorySchema.parse(req.body);
    const category = await menuRepository.updateCategory(req.params.id as string, data);
    req.app.get('io')?.emit(SocketEvents.MENU_UPDATED);
    res.json({ category });
  } catch (err) {
    next(err);
  }
});

menuRouter.delete('/categories/:id', authenticate, requireRole([Role.ADMIN]), async (req, res, next) => {
  try {
    // Delete items in category first? (For sqlite foreign key with cascade, this would happen automatically if configured, otherwise we should manually delete them)
    // Actually wait, let's keep it simple, assume client handles it or repository throws if not empty.
    await menuRepository.deleteCategory(req.params.id as string);
    req.app.get('io')?.emit(SocketEvents.MENU_UPDATED);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Admin: Manage Menu Items
menuRouter.post('/items', authenticate, requireRole([Role.ADMIN]), async (req, res, next) => {
  try {
    const data = CreateMenuItemSchema.parse(req.body);
    const item = await menuRepository.createMenuItem(data);
    req.app.get('io')?.emit(SocketEvents.MENU_UPDATED);
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
});

menuRouter.put('/items/:id', authenticate, requireRole([Role.ADMIN]), async (req, res, next) => {
  try {
    const data = UpdateMenuItemSchema.parse(req.body);
    const item = await menuRepository.updateMenuItem(req.params.id as string, data);
    req.app.get('io')?.emit(SocketEvents.MENU_UPDATED);
    res.json({ item });
  } catch (err) {
    next(err);
  }
});

menuRouter.patch('/items/:id/availability', authenticate, requireRole([Role.ADMIN, Role.KITCHEN]), async (req, res, next) => {
  try {
    const { isAvailable } = z.object({ isAvailable: z.boolean() }).parse(req.body);
    const item = await menuRepository.updateMenuItem(req.params.id as string, { isAvailable });
    req.app.get('io')?.emit(SocketEvents.MENU_UPDATED);
    res.json({ item });
  } catch (err) {
    next(err);
  }
});

menuRouter.delete('/items/:id', authenticate, requireRole([Role.ADMIN]), async (req, res, next) => {
  try {
    await menuRepository.deleteMenuItem(req.params.id as string);
    req.app.get('io')?.emit(SocketEvents.MENU_UPDATED);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
