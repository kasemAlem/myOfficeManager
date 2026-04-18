import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import { expenseSchema, targetSchema, formatZodError } from '@/lib/validation';
import { getCurrencySymbol } from '@/lib/formatCurrency';
import {
  startOfYear, endOfYear,
  startOfMonth, endOfMonth,
  startOfQuarter, endOfQuarter,
  eachDayOfInterval, eachMonthOfInterval,
  format, isSameDay, isSameMonth
} from 'date-fns';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'monthly'; // monthly, quarterly, yearly
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');

    // Reference date based on params or today
    let date = new Date();
    if (yearParam) {
      const yearInt = parseInt(yearParam);
      if (monthParam) {
        const monthInt = parseInt(monthParam);
        date = new Date(yearInt, monthInt - 1, 1);
      } else {
        date = new Date(yearInt, 0, 1);
      }
    }

    let startDate, endDate;
    if (view === 'monthly') {
      startDate = startOfMonth(date);
      endDate = endOfMonth(date);
    } else if (view === 'quarterly') {
      startDate = startOfQuarter(date);
      endDate = endOfQuarter(date);
    } else {
      startDate = startOfYear(date);
      endDate = endOfYear(date);
    }

    // Set boundaries to absolute start and end of periods to be inclusive
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // 1. Fetch Income (Project Payments)
    const payments = await prisma.projectPayment.findMany({
      where: { 
        datePaid: { 
          gte: startDate, 
          lte: endDate 
        } 
      },
      include: { 
        project: { 
          select: { 
            name: true, 
            clientName: true 
          } 
        },
        createdBy: { 
          select: { 
            name: true 
          } 
        }
      },
      orderBy: { datePaid: 'desc' }
    });

    // 2. Fetch Business Expenses
    const expenses = await prisma.businessExpense.findMany({
      where: { 
        date: { 
          gte: startDate, 
          lte: endDate 
        } 
      },
      include: {
        createdBy: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });

    // 3. Fetch Financial Target
    const year = date.getFullYear();
    const targetObj = await prisma.financialTarget.findUnique({
      where: { year }
    });

    const totalIncome = payments.reduce((acc: number, p: any) => acc + (p.amount || 0), 0);
    const totalExpense = expenses.reduce((acc: number, e: any) => acc + (e.amount || 0), 0);
    const netProfit = totalIncome - totalExpense;

    // Period Target Calculation
    let periodTarget = 0;
    if (targetObj) {
      if (view === 'yearly') periodTarget = targetObj.targetAmount;
      else if (view === 'quarterly') periodTarget = targetObj.targetAmount / 4;
      else periodTarget = targetObj.targetAmount / 12;
    }

    // 4. Generate Chart Data for Visualization
    let chartData: any[] = [];
    if (view === 'monthly') {
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      chartData = days.map(d => {
        const income = payments
          .filter((p: any) => isSameDay(new Date(p.datePaid), d))
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const expense = expenses
          .filter((e: any) => isSameDay(new Date(e.date), d))
          .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
        return { name: format(d, 'd MMM'), income, expense };
      });
    } else {
      const months = eachMonthOfInterval({ start: startDate, end: endDate });
      chartData = months.map(m => {
        const income = payments
          .filter((p: any) => isSameMonth(new Date(p.datePaid), m))
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const expense = expenses
          .filter((e: any) => isSameMonth(new Date(e.date), m))
          .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
        return { name: format(m, 'MMM'), income, expense };
      });
    }

    return NextResponse.json({
      summary: {
        income: totalIncome,
        expenses: totalExpense,
        netProfit,
        target: periodTarget,
        progress: periodTarget > 0 ? (totalIncome / periodTarget) : 0
      },
      transactions: [
        ...payments.map((p: any) => ({ 
          id: p.id, type: 'INCOME', amount: p.amount, 
          date: p.datePaid, category: 'Project Payment', 
          notes: p.notes, reference: p.project?.name, 
          createdBy: p.createdBy?.name || 'System'
        })),
        ...expenses.map((e: any) => ({ 
          id: e.id, type: 'EXPENSE', amount: e.amount, 
          date: e.date, category: e.category, 
          notes: e.notes, reference: e.vendor,
          createdBy: e.createdBy?.name || 'System'
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      chartData,
      targetValue: targetObj?.targetAmount || 0
    });
  } catch (error) {
    console.error('Financials API GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { type } = data;

    if (type === 'EXPENSE') {
      const result = expenseSchema.safeParse(data);
      if (!result.success) {
        return NextResponse.json({ error: formatZodError(result.error) }, { status: 400 });
      }
      const validated = result.data;

      const expense = await prisma.businessExpense.create({
        data: {
          category: validated.category,
          amount: validated.amount,
          date: new Date(validated.date),
          vendor: validated.vendor || '',
          notes: validated.notes || '',
          isPaid: validated.isPaid,
          createdById: session.userId as string
        }
      });

      // Record Audit Log
      await recordAuditLog({
        action: 'EXPENSE_RECORDED',
        entity: 'BusinessExpense',
        entityId: expense.id,
        details: `Expense of ${getCurrencySymbol()}${expense.amount} recorded for category "${expense.category}"`,
        userId: session.userId as string
      });

      return NextResponse.json(expense);
    }

    if (type === 'TARGET') {
      const result = targetSchema.safeParse(data);
      if (!result.success) {
        return NextResponse.json({ error: formatZodError(result.error) }, { status: 400 });
      }
      const validated = result.data;

      const target = await prisma.financialTarget.upsert({
        where: { year: validated.year },
        update: { targetAmount: validated.amount },
        create: { year: validated.year, targetAmount: validated.amount }
      });

      // Record Audit Log
      await recordAuditLog({
        action: 'PROJECT_UPDATED', // Reuse update action for targets
        entity: 'Project',
        entityId: target.id,
        details: `Annual revenue target for ${validated.year} set to ${getCurrencySymbol()}${validated.amount}`,
        userId: session.userId as string
      });

      return NextResponse.json(target);
    }

    return NextResponse.json({ error: 'Invalid operation type' }, { status: 400 });
  } catch (error) {
    console.error('Financials API POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
