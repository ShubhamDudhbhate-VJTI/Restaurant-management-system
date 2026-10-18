import { inventoryRepository } from './repository';
import { recordAudit } from '../audit/service';
import { AppError } from '../../middleware/error';
import {
  type CreateInventoryInput,
  type UpdateInventoryInput,
  type AdjustInventoryInput
} from '@/contracts';

export class InventoryService {
  async getAllItems() {
    return inventoryRepository.findAll();
  }

  async getItem(id: string) {
    const item = await inventoryRepository.findById(id);
    if (!item) throw new AppError('NOT_FOUND', 404, 'Inventory item not found');
    return item;
  }

  async addItem(userId: string, data: CreateInventoryInput) {
    const item = await inventoryRepository.create(data);
    await recordAudit({
      actorUserId: userId,
      action: 'INVENTORY_ITEM_ADDED',
      entityType: 'INVENTORY',
      entityId: item.id,
      metadata: { name: item.name, quantity: item.quantity, unit: item.unit }
    });
    return item;
  }

  async updateItem(userId: string, id: string, data: UpdateInventoryInput) {
    const existing = await inventoryRepository.findById(id);
    if (!existing) throw new AppError('NOT_FOUND', 404, 'Inventory item not found');

    const item = await inventoryRepository.update(id, data);
    await recordAudit({
      actorUserId: userId,
      action: 'INVENTORY_ITEM_UPDATED',
      entityType: 'INVENTORY',
      entityId: item.id,
      metadata: { changes: data }
    });
    return item;
  }

  async deleteItem(userId: string, id: string) {
    const existing = await inventoryRepository.findById(id);
    if (!existing) throw new AppError('NOT_FOUND', 404, 'Inventory item not found');

    await inventoryRepository.delete(id);
    await recordAudit({
      actorUserId: userId,
      action: 'INVENTORY_ITEM_DELETED',
      entityType: 'INVENTORY',
      entityId: id,
      metadata: { name: existing.name }
    });
  }

  async adjustStock(userId: string, id: string, data: AdjustInventoryInput) {
    const existing = await inventoryRepository.findById(id);
    if (!existing) throw new AppError('NOT_FOUND', 404, 'Inventory item not found');

    const item = await inventoryRepository.adjustQuantity(id, data.adjustment);
    await recordAudit({
      actorUserId: userId,
      action: 'INVENTORY_ADJUSTED',
      entityType: 'INVENTORY',
      entityId: id,
      metadata: {
        adjustment: data.adjustment,
        previousQuantity: existing.quantity,
        newQuantity: item.quantity,
        notes: data.notes
      }
    });
    return item;
  }
}

export const inventoryService = new InventoryService();
