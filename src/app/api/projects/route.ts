import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const projects = await prisma.project.findMany({
      include: {
        milestones: true,
        payments: true,
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();
    
    // Read dynamic phase config for initial status
    let initialStatus = 'ייזום והגדרת פרויקט';
    try {
      const configPath = require('path').join(process.cwd(), 'phases-config.json');
      if (require('fs').existsSync(configPath)) {
        const configData = JSON.parse(require('fs').readFileSync(configPath, 'utf8'));
        if (configData.phases && configData.phases.length > 0) {
          initialStatus = configData.phases[0].name;
        }
      }
    } catch(e) { console.error('Failed formatting dynamic status flag', e); }
    
    // Default budget = totalFees usually initially for architecture
    const project = await prisma.project.create({
      data: {
        name: data.name,
        clientName: data.name, // project name IS the client name
        totalFees: Number(data.totalFees),
        budget: Number(data.totalFees),
        status: initialStatus,
        notes: data.notes || '',
        ...(data.contact?.name ? {
          contacts: {
            create: [{
              name: data.contact.name,
              title: data.contact.title || '',
              email: data.contact.email || '',
              phone: data.contact.phone || '',
            }]
          }
        } : {})
      }
    });

    // Record Audit Log
    await recordAuditLog({
      action: 'PROJECT_CREATED',
      entity: 'Project',
      entityId: project.id,
      details: `Project "${project.name}" created with total fees ₪${project.totalFees}`,
      userId: (session as any).userId
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
