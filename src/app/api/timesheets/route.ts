import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    const monthStr = searchParams.get('month');
    const yearStr = searchParams.get('year');

    let whereClause: any = {};
    if (session.role === 'EMPLOYEE') {
      whereClause.employeeId = session.userId as string;
    } else if (requestedUserId) {
      whereClause.employeeId = requestedUserId;
    } else {
      whereClause.employeeId = session.userId as string; // Default to self even for managers if not specified
    }

    if (monthStr && yearStr) {
      const month = parseInt(monthStr);
      const year = parseInt(yearStr);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      whereClause.dateLogged = {
        gte: startDate,
        lte: endDate
      };
    }

    const logs = await prisma.timeLog.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: {
        project: { select: { name: true } },
        employee: { select: { name: true } }
      },
      orderBy: { dateLogged: 'desc' }
    });

    // Also get projects for dropdown
    const projects = await prisma.project.findMany({
      select: { id: true, name: true }
    });

    // Determine team topology for managers/admins
    let teamMembers: any[] = [];
    if (session.role === 'ADMIN' || session.role === 'MANAGER') {
      teamMembers = await prisma.user.findMany({
        select: { id: true, name: true, role: true },
        orderBy: { name: 'asc' }
      });
    }

    return NextResponse.json({ logs, projects, teamMembers });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();
    let timeLog;

    if (data.id) {
      // Security check: Verify ownership
      const existing = await prisma.timeLog.findFirst({
        where: { id: data.id, employeeId: session.userId as string }
      });
      if (!existing) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });

      timeLog = await prisma.timeLog.update({
        where: { id: data.id },
        data: {
          projectId: data.projectId || null,
          category: data.category || 'WORK',
          hours: Number(data.hours),
          notes: data.notes || '',
          // explicitly not changing dateLogged, as its structural. If they change date, they should delete & re-add, though usually handled via day specific.
        }
      });
    } else {
      timeLog = await prisma.timeLog.create({
        data: {
          employeeId: session.userId as string,
          projectId: data.projectId || null,
          category: data.category || 'WORK',
          hours: Number(data.hours),
          dateLogged: new Date(data.dateLogged),
          notes: data.notes || '',
        }
      });
    }

    return NextResponse.json(timeLog, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const existing = await prisma.timeLog.findFirst({
        where: { id, employeeId: session.userId as string }
    });
    
    if (!existing) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });

    await prisma.timeLog.delete({ where: { id } });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
