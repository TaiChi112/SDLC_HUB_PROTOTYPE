import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/app/auth';

function isPrismaConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /P1001|P1002|P1017|Can't reach database server|Connection terminated/i.test(error.message);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const existingSpec = await prisma.projectSpec.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!existingSpec) {
      return NextResponse.json({ error: 'Spec not found' }, { status: 404 });
    }

    if (existingSpec.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.projectSpec.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Error deleting user spec:', error);

    if (isPrismaConnectionError(error)) {
      return NextResponse.json(
        { error: 'Database is temporarily unavailable. Please try again shortly.', code: 'DATABASE_UNAVAILABLE' },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: 'Failed to delete spec' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { isPublished } = body as { isPublished?: boolean };

    if (typeof isPublished !== 'boolean') {
      return NextResponse.json({ error: 'isPublished must be boolean' }, { status: 400 });
    }

    const existingSpec = await prisma.projectSpec.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!existingSpec) {
      return NextResponse.json({ error: 'Spec not found' }, { status: 404 });
    }

    if (existingSpec.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedSpec = await prisma.projectSpec.update({
      where: { id },
      data: { isPublished },
      select: { id: true, isPublished: true },
    });

    return NextResponse.json({ message: 'Updated', spec: updatedSpec });
  } catch (error) {
    console.error('Error updating publish status:', error);

    if (isPrismaConnectionError(error)) {
      return NextResponse.json(
        { error: 'Database is temporarily unavailable. Please try again shortly.', code: 'DATABASE_UNAVAILABLE' },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: 'Failed to update spec' }, { status: 500 });
  }
}
