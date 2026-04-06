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

    if (isNaN(month) || isNaN(year)) {
      return NextResponse.json({ error: 'Invalid month or year' }, { status: 400 });
    }

    const submission = await prisma.timesheetSubmission.findUnique({
      where: {
        userId_month_year: {
          userId: (session as any).userId,
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
        userId: (session as any).userId,
        month,
        year,
        status: 'SUBMITTED',
        submittedAt: new Date()
      }
    });

    // TRIGGER EMAIL TO MANAGER (Optional but recommended here)
    // We already have report logic, we can trigger it or let the frontend do it.
    // For now, returning the submission.

    return NextResponse.json(submission, { status: 201 });
  } catch (error: any) {
    console.error('Submission Error:', error.message);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Already submitted for this period' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
