import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import * as XLSX from 'xlsx';
import nodemailer from 'nodemailer';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '');
    const year = parseInt(searchParams.get('year') || '');

    if (isNaN(month) || isNaN(year)) {
      return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
    }

    const requestedUserId = searchParams.get('userId');

    let targetUserId = undefined;
    if (session.role === 'EMPLOYEE') {
      targetUserId = session.userId as string;
    } else if (requestedUserId) {
      targetUserId = requestedUserId;
    }

    // 1. Fetch Month Logs
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const whereClause: Record<string, unknown> = {
      dateLogged: {
        gte: startDate,
        lte: endDate
      }
    };
    if (targetUserId) {
      whereClause.employeeId = targetUserId;
    }

    const logs = await prisma.timeLog.findMany({
      where: whereClause,
      include: {
        employee: { select: { name: true, email: true } },
        project: { select: { name: true } }
      },
      orderBy: { dateLogged: 'asc' }
    });

    if (logs.length === 0) {
      return NextResponse.json({ error: 'No data for this period' }, { status: 404 });
    }

    // 2. Format Data for Excel
    const excelData = logs.map(log => ({
      'Date': new Date(log.dateLogged).toLocaleDateString(),
      'Employee': log.employee.name,
      'Email': log.employee.email,
      'Category': log.category,
      'Project': log.project?.name || 'N/A',
      'Hours': log.hours,
      'Notes': log.notes || ''
    }));

    // 3. Create Workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const monthName = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long' });

    // 4. Return File as Download
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Attendance_Report_${monthName}_${year}.xlsx"`
      }
    });

  } catch (error) {
    console.error('Report Generation Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
