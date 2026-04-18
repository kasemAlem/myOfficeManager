import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '');
    const year = parseInt(searchParams.get('year') || '');

    const requestedUserId = searchParams.get('userId');
    let targetUserId = session.userId as string;
    if ((session.role === 'ADMIN' || session.role === 'MANAGER') && requestedUserId) {
      targetUserId = requestedUserId;
    }

    if (isNaN(month) || isNaN(year)) {
      return NextResponse.json({ error: 'Invalid month or year' }, { status: 400 });
    }

    const submission = await prisma.timesheetSubmission.findUnique({
      where: {
        userId_month_year: {
          userId: targetUserId,
          month,
          year
        }
      }
    });

    return NextResponse.json({ submitted: !!submission, submission });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { month: rawMonth, year: rawYear } = await request.json();
    const month = parseInt(rawMonth.toString());
    const year = parseInt(rawYear.toString());

    // Check if the month is finished
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-indexed
    const currentYear = now.getFullYear();
    
    const isFutureOrCurrent = (year > currentYear) || (year === currentYear && month >= currentMonth);
    if (isFutureOrCurrent) {
      return NextResponse.json({ error: 'Cannot submit timesheets for the current or future months. Please wait until the month is finished.' }, { status: 400 });
    }

    // Check if ALL days of the month are filled
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const logs = await prisma.timeLog.findMany({
      where: {
        employeeId: session.userId as string,
        dateLogged: {
          gte: new Date(year, month - 1, 1),
          lte: new Date(year, month - 1, lastDayOfMonth, 23, 59, 59)
        }
      },
      include: {
        project: { select: { name: true } },
        employee: { select: { name: true, email: true } }
      }
    });

    // Check unique days logged
    const loggedDays = new Set(logs.map(l => l.dateLogged.getDate()));
    if (loggedDays.size < lastDayOfMonth) {
      const missingDays = [];
      for (let day = 1; day <= lastDayOfMonth; day++) {
        if (!loggedDays.has(day)) missingDays.push(day);
      }
      return NextResponse.json({ 
        error: `Please fill out all days. Missing entries for: ${missingDays.join(', ')}`,
        missingDays 
      }, { status: 400 });
    }

    const submission = await prisma.timesheetSubmission.create({
      data: {
        userId: session.userId as string,
        month,
        year,
        status: 'SUBMITTED',
        submittedAt: new Date()
      }
    });

    try {
      const employeeName = logs[0]?.employee?.name || 'Unknown Employee';
      const employeeEmail = logs[0]?.employee?.email || 'unknown@example.com';

      // Format Data for Excel
      const excelData = logs.map(log => ({
        'Date': new Date(log.dateLogged).toLocaleDateString(),
        'Category': log.category,
        'Project': log.project?.name || 'N/A',
        'Hours': Number(log.hours) || 0,
        'Notes': log.notes || ''
      }));

      // Create Workbook
      const XLSX = require('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Send Email to Managers and Admins
      const managers = await prisma.user.findMany({
        where: { role: { in: ['MANAGER', 'ADMIN'] } },
        select: { email: true }
      });
      
      const managerEmails = managers.map(m => m.email);
      if (managerEmails.length > 0) {
          const nodemailer = require('nodemailer');
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_PORT === '465',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          });
          const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Control System';
          const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@domain.com';
          const monthName = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long' });
          
          await transporter.sendMail({
            from: `"${companyName}" <${fromEmail}>`,
            to: managerEmails.join(', '),
            subject: `Attendance Submitted: ${employeeName} - ${monthName} ${year}`,
            text: `Hello,\n\nEmployee ${employeeName} (${employeeEmail}) has finalized their monthly attendance report for ${monthName} ${year}.\n\nPlease find the detailed daily breakdown attached below as a spreadsheet.`,
            attachments: [
              {
                filename: `Attendance_${employeeName.replace(/\s+/g, '_')}_${monthName}_${year}.xlsx`,
                content: buffer
              }
            ]
          });
      }
    } catch (emailError) {
      console.error('Email Dispatch Error:', emailError);
      // Failsafe: Continue securely instead of rejecting the database submission
    }

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error('Submission Error:', error);
    if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Already submitted for this period' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
