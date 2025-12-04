import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createS3Client } from '@/lib/s3/client';
import { testConnection } from '@/lib/s3/operations';
import { setSession } from '@/lib/auth';

const loginSchema = z.object({
  endpoint: z.string().url(),
  filerEndpoint: z.string().url(),
  accessKeyId: z.string().min(1),
  secretAccessKey: z.string().min(1),
  region: z.string().default('us-east-1'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid credentials format' } },
        { status: 400 }
      );
    }

    const { endpoint, filerEndpoint, accessKeyId, secretAccessKey, region } = parsed.data;

    const client = createS3Client({ endpoint, accessKeyId, secretAccessKey, region });
    const isValid = await testConnection(client);

    if (!isValid) {
      return NextResponse.json(
        { error: { code: 'AUTH_FAILED', message: 'Invalid credentials or endpoint' } },
        { status: 401 }
      );
    }

    await setSession({ endpoint, filerEndpoint, accessKeyId, secretAccessKey, region });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
