import { NextResponse } from 'next/server';
import { getIAMConfig } from '@/lib/iam/client';
import { regenerateCredentials } from '@/lib/iam/operations';

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const config = await getIAMConfig();
    const { userId } = await context.params;

    const result = await regenerateCredentials(config, userId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'User not found') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.error('Failed to regenerate credentials:', error);
    return NextResponse.json({ error: 'Failed to regenerate credentials' }, { status: 500 });
  }
}
