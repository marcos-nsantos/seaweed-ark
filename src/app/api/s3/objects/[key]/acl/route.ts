import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { createS3Client } from '@/lib/s3/client';
import { getObjectAcl, setObjectAcl } from '@/lib/s3/operations';

const setAclSchema = z.object({
  bucket: z.string().min(1),
  acl: z.enum(['private', 'public-read', 'public-read-write', 'authenticated-read']),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const { key } = await params;
  const bucket = request.nextUrl.searchParams.get('bucket');

  if (!bucket) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Bucket is required' } },
      { status: 400 }
    );
  }

  try {
    const client = createS3Client(session);
    const acl = await getObjectAcl(client, bucket, decodeURIComponent(key));
    return NextResponse.json({ data: acl });
  } catch (error) {
    console.error('Get ACL error:', error);
    return NextResponse.json(
      { error: { code: 'ACL_ERROR', message: error instanceof Error ? error.message : 'Failed to get ACL' } },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const { key } = await params;

  try {
    const body = await request.json();
    const parsed = setAclSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid request body' } },
        { status: 400 }
      );
    }

    const { bucket, acl } = parsed.data;
    const client = createS3Client(session);
    await setObjectAcl(client, bucket, decodeURIComponent(key), acl);

    return NextResponse.json({ data: { success: true, acl } });
  } catch (error) {
    console.error('Set ACL error:', error);
    return NextResponse.json(
      { error: { code: 'ACL_ERROR', message: error instanceof Error ? error.message : 'Failed to set ACL' } },
      { status: 500 }
    );
  }
}
