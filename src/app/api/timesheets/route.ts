import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const logs = await prisma.timeLog.findMany({
      where: session.role === 'EMPLOYEE' ? { employeeId: session.userId as string } : undefined,
      include: {
        project: { select: { name: true } },
        employee: { select: { name: true } }
      },
      orderBy: { dateLogged: 'desc' }
    });

    // Also get projects for dropdown
    const projects = await prisma.project.findMany({
      where: { status: { in: ['PLANNING', 'IN_PROGRESS', 'ACTIVE', 'DESIGN', 'CONSTRUCTION'] } },
      select: { id: true, name: true }
    });

    return NextResponse.json({ logs, projects });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();

    const timeLog = await prisma.timeLog.upsert({
      where: {
        employeeId_dateLogged: {
          employeeId: session.userId as string,
          dateLogged: new Date(data.dateLogged)
        }
      },
      update: {
        projectId: data.projectId || null,
        category: data.category || 'WORK',
        hours: Number(data.hours),
        notes: data.notes || '',
      },
      create: {
        employeeId: session.userId as string,
        projectId: data.projectId || null,
        category: data.category || 'WORK',
        hours: Number(data.hours),
        dateLogged: new Date(data.dateLogged),
        notes: data.notes || '',
      }
    });

    return NextResponse.json(timeLog, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
