import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getIAMConfig } from '@/lib/iam/client';
import { listUsers, createUser, deleteUser } from '@/lib/iam/operations';

const createUserSchema = z.object({
  userName: z.string().min(1).max(64),
});

export async function GET() {
  try {
    const config = await getIAMConfig();
    const users = await listUsers(config);
    return NextResponse.json(users);
  } catch (error) {
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Filer endpoint not configured')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Failed to list users:', error);
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const config = await getIAMConfig();
    const body = await request.json();

    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.flatten();
      return NextResponse.json(
        { error: errors.fieldErrors.userName?.[0] ?? 'Invalid input' },
        { status: 400 }
      );
    }

    const result = await createUser(config, parsed.data.userName);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const config = await getIAMConfig();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    await deleteUser(config, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'User not found') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
