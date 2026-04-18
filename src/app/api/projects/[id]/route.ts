import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(request: Request, context: any) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const params = await context.params;
    if (!params?.id) return NextResponse.json({ error: 'Missing project ID' }, { status: 400 });

    const includeConfig: any = {
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
      where: { id: params.id },
      include: includeConfig
    });

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    return NextResponse.json(project);
  } catch (error: any) {
    console.error('Project Fetch Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function PUT(request: Request, context: any) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const params = await context.params;
    const data = await request.json();

    // Validate required fields for the record but allow partial updates in the logic
    const updateData: any = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
      // Also update clientName if it's not explicitly provided
      updateData.clientName = data.clientName ?? data.name;
    }
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.totalFees !== undefined && data.totalFees !== null) {
      updateData.totalFees = Number(data.totalFees);
    }

    const project = await prisma.project.update({
      where: { id: params.id },
      data: updateData
    });

    // Record Audit Log
    await recordAuditLog({
      action: 'PROJECT_UPDATED',
      entity: 'Project',
      entityId: project.id,
      details: `Project updated: ${Object.keys(updateData).join(', ')}`,
      userId: (session as any).userId
    });

    return NextResponse.json(project);
  } catch (error: any) {
    console.error('Project Update Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message,
      code: error.code 
    }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((session as any).role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const params = await context.params;

    const projectToDelete = await prisma.project.findUnique({ where: { id: params.id } });
    
    await prisma.project.delete({ where: { id: params.id } });

    // Record Audit Log
    if (projectToDelete) {
      await recordAuditLog({
        action: 'PROJECT_DELETED',
        entity: 'Project',
        entityId: params.id,
        details: `Project "${projectToDelete.name}" was permanently deleted.`,
        userId: (session as any).userId
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
