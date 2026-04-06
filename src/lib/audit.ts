import { prisma } from './prisma';

interface AuditLogParams {
  action: 'PROJECT_CREATED' | 'PROJECT_UPDATED' | 'PROJECT_DELETED' | 'PAYMENT_RECORDED' | 'EXPENSE_RECORDED' | 'MILESTONE_UPDATED' | 'STAFF_ADDED';
  entity: 'Project' | 'ProjectPayment' | 'BusinessExpense' | 'ProjectMilestone' | 'User';
  entityId: string;
  details?: string;
  userId?: string;
}

export async function recordAuditLog({
  action,
  entity,
  entityId,
  details,
  userId
}: AuditLogParams) {
  try {
    await (prisma as any).auditLog.create({
      data: {
        action,
        entity,
        entityId,
        details: details || '',
        userId: userId || null
      }
    });
  } catch (error) {
    console.error('Failed to record audit log:', error);
  }
}
