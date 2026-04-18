import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { milestoneSchema, formatZodError } from '@/lib/validation';
import type { Prisma } from '@prisma/client';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const result = milestoneSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: formatZodError(result.error) }, { status: 400 });
    }
    const data = result.data;

    const milestone = await prisma.projectMilestone.create({
      data: {
        projectId: id,
        name: data.name,
        feeAmount: data.feeAmount ? Number(data.feeAmount) : 0,
        isCompleted: false,
        dueDate: data.dueDate ? new Date(data.dueDate) : null
      }
    });

    return NextResponse.json(milestone, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();

    if (data.id) {
      const updateData: Prisma.ProjectMilestoneUpdateInput = {};
      if (typeof data.isCompleted === 'boolean') updateData.isCompleted = data.isCompleted;
      if (typeof data.notes === 'string') updateData.notes = data.notes;

      const ms = await prisma.projectMilestone.update({
        where: { id: data.id },
        data: updateData
      });
      return NextResponse.json(ms);
    }

    return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    await prisma.projectMilestone.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
