import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Missing project ID' }, { status: 400 });

    const data = await request.json();
    if (!data.amount) return NextResponse.json({ error: 'Amount is required' }, { status: 400 });

    const payment = await (prisma as any).projectPayment.create({
      data: {
        projectId: id,
        amount: Number(data.amount),
        datePaid: data.datePaid ? new Date(data.datePaid) : new Date(),
        notes: data.notes || '',
        createdById: (session as any).userId
      }
    });

    // Record Audit Log
    await recordAuditLog({
      action: 'PAYMENT_RECORDED',
      entity: 'ProjectPayment',
      entityId: (payment as any).id,
      details: `Payment of ₪${payment.amount} recorded for project ID ${id}. Notes: ${payment.notes || 'None'}`,
      userId: (session as any).userId
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error('Payment API Error:', error.message);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
