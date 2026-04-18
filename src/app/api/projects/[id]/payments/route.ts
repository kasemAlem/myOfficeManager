import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import { paymentSchema, formatZodError } from '@/lib/validation';
import { getCurrencySymbol } from '@/lib/formatCurrency';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Missing project ID' }, { status: 400 });

    const body = await request.json();
    const result = paymentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: formatZodError(result.error) }, { status: 400 });
    }
    const data = result.data;

    const payment = await prisma.projectPayment.create({
      data: {
        projectId: id,
        amount: data.amount,
        datePaid: new Date(data.datePaid),
        notes: data.notes || '',
        createdById: session.userId as string
      }
    });

    await recordAuditLog({
      action: 'PAYMENT_RECORDED',
      entity: 'ProjectPayment',
      entityId: payment.id,
      details: `Payment of ${getCurrencySymbol()}${payment.amount} recorded for project ID ${id}. Notes: ${payment.notes || 'None'}`,
      userId: session.userId as string
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Payment API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
