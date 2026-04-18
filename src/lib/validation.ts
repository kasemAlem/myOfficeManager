import { z } from 'zod/v4';

export const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']).optional().default('EMPLOYEE'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  totalFees: z.number().min(0, 'Total fees must be non-negative'),
  clientName: z.string().optional().default(''),
  clientEmail: z.string().optional(),
  clientPhone: z.string().optional(),
  status: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  budget: z.number().optional(),
  contact: z.object({
    name: z.string(),
    title: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
  }).nullable().optional(),
});

export const paymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  datePaid: z.string().min(1, 'Payment date is required'),
  notes: z.string().optional(),
});

export const expenseSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().min(1, 'Date is required'),
  vendor: z.string().optional(),
  notes: z.string().optional(),
  isPaid: z.boolean().optional().default(true),
});

export const targetSchema = z.object({
  amount: z.number().positive('Target amount must be positive'),
  year: z.number().int().min(2000).max(2100),
});

export const timeLogSchema = z.object({
  projectId: z.string().optional(),
  category: z.enum(['WORK', 'SICK', 'HOLIDAY', 'ABSENCE']),
  hours: z.number().min(0).max(24),
  dateLogged: z.string().min(1),
  notes: z.string().optional(),
});

export const teamUpdateSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']).optional(),
  password: z.string().min(8).optional(),
}).refine(data => data.role || data.password, {
  message: 'Either role or password must be provided',
});

export const teamCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']),
});

export const milestoneSchema = z.object({
  name: z.string().min(1, 'Milestone name is required'),
  feeAmount: z.number().min(0).optional(),
  dueDate: z.string().optional(),
});

export const contactSchema = z.object({
  name: z.string().min(1, 'Contact name is required'),
  phone: z.string().optional(),
  email: z.string().optional(),
  title: z.string().optional(),
  isPrimary: z.boolean().optional().default(false),
});

export const documentLinkSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  url: z.url('Invalid URL'),
});

export const forgotPasswordSchema = z.object({
  email: z.email('Invalid email address'),
});

export function formatZodError(error: z.ZodError): string {
  return error.issues.map(issue => issue.message).join(', ');
}
