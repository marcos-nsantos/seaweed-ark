import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getIAMConfig } from '@/lib/iam/client';
import { updateUserPermissions } from '@/lib/iam/operations';

const permissionsSchema = z.object({
  permissions: z.array(
    z.object({
      bucket: z.string().min(1),
      actions: z.array(z.enum(['Admin', 'Read', 'Write', 'List', 'Tagging'])),
    })
  ),
});

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const config = await getIAMConfig();
    const { userId } = await context.params;
    const body = await request.json();

    const parsed = permissionsSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.flatten();
      return NextResponse.json(
        { error: errors.fieldErrors.permissions?.[0] ?? 'Invalid permissions format' },
        { status: 400 }
      );
    }

    await updateUserPermissions(config, userId, parsed.data.permissions);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'User not found') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.error('Failed to update permissions:', error);
    return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 });
  }
}
