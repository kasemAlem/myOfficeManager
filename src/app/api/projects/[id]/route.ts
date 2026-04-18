import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import type { Prisma } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Missing project ID' }, { status: 400 });

    const includeConfig: Prisma.ProjectInclude = {
      milestones: { orderBy: { createdAt: 'asc' } },
      payments: { orderBy: { datePaid: 'desc' } },
      documentLinks: true,
      contacts: { orderBy: { createdAt: 'asc' } },
    };

    if (session.role === 'ADMIN' || session.role === 'MANAGER') {
      includeConfig.timeLogs = {
        include: { employee: { select: { name: true, id: true } } }
      };
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: includeConfig
    });

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Project Fetch Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const data = await request.json();

    const updateData: Prisma.ProjectUpdateInput = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
      updateData.clientName = data.clientName ?? data.name;
    }
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.totalFees !== undefined && data.totalFees !== null) {
      updateData.totalFees = Number(data.totalFees);
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData
    });

    await recordAuditLog({
      action: 'PROJECT_UPDATED',
      entity: 'Project',
      entityId: project.id,
      details: `Project updated: ${Object.keys(updateData).join(', ')}`,
      userId: session.userId as string
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Project Update Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    const projectToDelete = await prisma.project.findUnique({ where: { id } });

    await prisma.project.delete({ where: { id } });

    if (projectToDelete) {
      await recordAuditLog({
        action: 'PROJECT_DELETED',
        entity: 'Project',
        entityId: id,
        details: `Project "${projectToDelete.name}" was permanently deleted.`,
        userId: session.userId as string
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
