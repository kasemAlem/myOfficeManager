import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import * as XLSX from 'xlsx';
import nodemailer from 'nodemailer';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || ((session as any).role !== 'ADMIN' && (session as any).role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '');
    const year = parseInt(searchParams.get('year') || '');

    if (isNaN(month) || isNaN(year)) {
      return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
    }

    // 1. Fetch Month Logs
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const logs = await prisma.timeLog.findMany({
      where: {
        dateLogged: {
          gte: startDate,
          lte: endDate
        }
      },
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

    // 4. Send Email to Managers
    const managers = await prisma.user.findMany({
      where: { role: 'MANAGER' },
      select: { email: true }
    });

    const managerEmails = managers.map(m => m.email);
    if (managerEmails.length > 0) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Control System';
        const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@domain.com';
        await transporter.sendMail({
          from: `"${companyName}" <${fromEmail}>`,
          to: managerEmails.join(', '),
          subject: `Attendance Report: ${month}/${year}`,
          text: `Attached is the comprehensive monthly attendance report for ${companyName} for the period ${month}/${year}.`,
          attachments: [
            {
              filename: `Attendance_Report_${month}_${year}.xlsx`,
              content: buffer
            }
          ]
        });
      } catch (mailError: any) {
        console.error('Mail Transmission Error:', mailError.message);
        // We still return the report download even if email fails
      }
    }

    // 5. Return File as Download
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Attendance_Report_${month}_${year}.xlsx"`
      }
    });

  } catch (error: any) {
    console.error('Report Generation Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
