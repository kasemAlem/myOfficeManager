import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request, context: any) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const params = await context.params;
    const data = await request.json();

    const milestone = await prisma.projectMilestone.create({
      data: {
        projectId: params.id,
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

export async function PUT(request: Request, context: any) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json(); // Array of milestones to update
    
    // Handle toggle completion or notes update
    if (data.id) {
      const updateData: any = {};
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
