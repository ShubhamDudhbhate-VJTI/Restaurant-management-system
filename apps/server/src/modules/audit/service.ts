import { db } from '../../db/client';
import { auditLogs } from '../../db/schema';
import { nanoid } from 'nanoid';

export async function recordAudit(input: {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(auditLogs).values({
    id: nanoid(),
    actorUserId: input.actorUserId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  });
}
