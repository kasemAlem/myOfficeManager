import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const params = await context.params;
    const data = await request.json();
    
    const contact = await prisma.projectContact.create({
      data: {
        projectId: params.id,
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        title: data.title || null,
        isPrimary: data.isPrimary || false,
      }
    });

    return NextResponse.json(contact);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add contact' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const params = await context.params;
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('id');

    if (!contactId) return NextResponse.json({ error: 'Contact ID required' }, { status: 400 });

    await prisma.projectContact.delete({
      where: { id: contactId, projectId: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('id');
    if (!contactId) return NextResponse.json({ error: 'Contact ID required' }, { status: 400 });

    const data = await request.json();

    const contact = await prisma.projectContact.update({
      where: { id: contactId },
      data: {
        name: data.name,
        title: data.title || null,
        email: data.email || null,
        phone: data.phone || null,
      }
    });

    return NextResponse.json(contact);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
}
