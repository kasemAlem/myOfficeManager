import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { documentLinkSchema, formatZodError } from '@/lib/validation';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const result = documentLinkSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: formatZodError(result.error) }, { status: 400 });
    }
    const data = result.data;

    const documentLink = await prisma.documentLink.create({
      data: {
        projectId: id,
        title: data.title,
        url: data.url
      }
    });

    return NextResponse.json(documentLink, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if(!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await prisma.documentLink.delete({
       where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
